import { ensureStripeCustomer, requireAdmin, stripeClient } from "../_shared/clients.ts";
import { mapInvoiceStatus } from "../_shared/billing-map.mjs";
import { json, optionsResponse } from "../_shared/http.ts";

function daysUntil(dueDate) {
    if (!dueDate) return 14;
    const due = new Date(`${dueDate}T00:00:00Z`);
    const today = new Date();
    const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const diff = Math.ceil((due.getTime() - start) / 86400000);
    return Math.max(1, diff);
}

Deno.serve(async (req) => {
    const preflight = optionsResponse(req);
    if (preflight) return preflight;
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    try {
        const { admin } = await requireAdmin(req);
        const body = await req.json();
        const amountCents = Number(body.amountCents);
        const description = typeof body.description === "string" ? body.description.trim() : "";
        if (!body.clientId || !Number.isInteger(amountCents) || amountCents < 50 || amountCents > 100000000) {
            return json({ error: "Enter a client and an amount of at least $0.50" }, 400);
        }
        if (!description) return json({ error: "Description is required" }, 400);

        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("id, full_name, stripe_customer_id, role")
            .eq("id", body.clientId)
            .single();
        if (profileError || !profile) return json({ error: "Client not found" }, 404);

        const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id);
        if (userError || !authUser.user?.email) return json({ error: "Client is missing an email" }, 400);

        const stripe = stripeClient();
        const customerId = await ensureStripeCustomer(stripe, admin, profile, authUser.user.email);

        const draft = await stripe.invoices.create({
            customer: customerId,
            collection_method: "send_invoice",
            days_until_due: daysUntil(body.dueDate),
            auto_advance: false,
            description,
            metadata: { supabase_user_id: profile.id },
        });

        await stripe.invoiceItems.create({
            customer: customerId,
            invoice: draft.id,
            amount: amountCents,
            currency: "usd",
            description,
        });

        let invoice = await stripe.invoices.finalizeInvoice(draft.id);
        if (body.send) {
            invoice = await stripe.invoices.sendInvoice(invoice.id);
        }

        const { data: row, error: insertError } = await admin
            .from("invoices")
            .insert({
                client_id: profile.id,
                stripe_invoice_id: invoice.id,
                amount_cents: amountCents,
                status: mapInvoiceStatus(invoice.status),
                due_date: body.dueDate || null,
                description,
                hosted_invoice_url: invoice.hosted_invoice_url,
                invoice_pdf: invoice.invoice_pdf,
            })
            .select("id, status, hosted_invoice_url")
            .single();
        if (insertError) return json({ error: insertError.message }, 500);

        return json({ invoice: row });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create invoice";
        const status = message === "Unauthorized" || message === "Missing authorization"
            ? 401
            : message === "Forbidden"
            ? 403
            : 500;
        return json({ error: message }, status);
    }
});
