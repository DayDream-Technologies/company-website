import { requireUser, stripeClient } from "../_shared/clients.ts";
import { isAllowedOrigin, json, optionsResponse, safeReturnUrl } from "../_shared/http.ts";

Deno.serve(async (req) => {
    const preflight = optionsResponse(req);
    if (preflight) return preflight;
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    try {
        const { user, admin } = await requireUser(req);
        const body = await req.json().catch(() => ({}));
        const origin = req.headers.get("Origin") || "";
        const fallbackOrigin = isAllowedOrigin(origin) ? origin : "https://www.daydreamtechnologies.net";
        const returnUrl = safeReturnUrl(body.returnUrl, `${fallbackOrigin}/dashboard`);

        const { data: profile, error } = await admin
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();
        if (error || !profile?.stripe_customer_id) {
            return json({ error: "Subscribe to a plan before managing billing" }, 400);
        }

        const stripe = stripeClient();
        const params = {
            customer: profile.stripe_customer_id,
            return_url: returnUrl,
        };

        if (body.flow === "cancel" && body.subscriptionId) {
            const { data: subscription } = await admin
                .from("subscriptions")
                .select("stripe_subscription_id")
                .eq("client_id", user.id)
                .eq("stripe_subscription_id", body.subscriptionId)
                .maybeSingle();
            if (!subscription) return json({ error: "Subscription not found" }, 404);
            params.flow_data = {
                type: "subscription_cancel",
                subscription_cancel: { subscription: body.subscriptionId },
            };
        }

        const session = await stripe.billingPortal.sessions.create(params);
        return json({ url: session.url });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not open billing portal";
        const status = message === "Unauthorized" || message === "Missing authorization" ? 401 : 500;
        return json({ error: message }, status);
    }
});
