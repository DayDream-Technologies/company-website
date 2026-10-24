import { ensureStripeCustomer, requireUser, stripeClient } from "../_shared/clients.ts";
import { isAllowedOrigin, json, optionsResponse, safeReturnUrl } from "../_shared/http.ts";

Deno.serve(async (req) => {
    const preflight = optionsResponse(req);
    if (preflight) return preflight;
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    try {
        const { user, admin } = await requireUser(req);
        const body = await req.json();
        const origin = req.headers.get("Origin") || "";
        const fallbackOrigin = isAllowedOrigin(origin) ? origin : "https://www.daydreamtechnologies.net";
        const successUrl = safeReturnUrl(body.successUrl, `${fallbackOrigin}/dashboard?billing=success`);
        const cancelUrl = safeReturnUrl(body.cancelUrl, `${fallbackOrigin}/dashboard?billing=cancel`);

        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("id, full_name, stripe_customer_id")
            .eq("id", user.id)
            .single();
        if (profileError || !profile) return json({ error: "Profile not found" }, 404);
        if (!user.email) return json({ error: "Account is missing an email" }, 400);

        const stripe = stripeClient();
        const customerId = await ensureStripeCustomer(stripe, admin, profile, user.email);

        if (body.invoiceId) {
            const { data: invoice, error } = await admin
                .from("invoices")
                .select("id, amount_cents, description, status, client_id, hosted_invoice_url")
                .eq("id", body.invoiceId)
                .single();
            if (error || !invoice || invoice.client_id !== user.id) {
                return json({ error: "Invoice not found" }, 404);
            }
            if (invoice.status === "paid" || invoice.status === "void") {
                return json({ error: "This invoice is not payable" }, 400);
            }
            if (invoice.hosted_invoice_url) {
                return json({ url: invoice.hosted_invoice_url });
            }

            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                customer: customerId,
                client_reference_id: user.id,
                line_items: [{
                    quantity: 1,
                    price_data: {
                        currency: "usd",
                        unit_amount: invoice.amount_cents,
                        product_data: { name: invoice.description || "Invoice" },
                    },
                }],
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    supabase_user_id: user.id,
                    invoice_id: invoice.id,
                },
            });
            return json({ url: session.url });
        }

        if (!body.priceId || typeof body.priceId !== "string") {
            return json({ error: "priceId is required" }, 400);
        }

        const { data: plan, error: planError } = await admin
            .from("service_plans")
            .select("id, name, interval, stripe_price_id, active")
            .eq("stripe_price_id", body.priceId)
            .maybeSingle();
        if (planError || !plan || !plan.active) return json({ error: "Unknown plan" }, 400);

        const mode = plan.interval === "one_time" ? "payment" : "subscription";
        const sessionParams = {
            mode,
            customer: customerId,
            client_reference_id: user.id,
            line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                supabase_user_id: user.id,
                plan_id: plan.id,
            },
        };
        if (mode === "subscription") {
            sessionParams.subscription_data = {
                metadata: { supabase_user_id: user.id, plan_id: plan.id },
            };
        }
        const session = await stripe.checkout.sessions.create(sessionParams);

        return json({ url: session.url });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Checkout failed";
        const status = message === "Unauthorized" || message === "Missing authorization" ? 401 : 500;
        return json({ error: message }, status);
    }
});
