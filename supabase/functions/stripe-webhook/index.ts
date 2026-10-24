import { adminClient, stripeClient } from "../_shared/clients.ts";
import { mapInvoiceStatus, periodBounds, subscriptionPriceId, unixToIso } from "../_shared/billing-map.mjs";
import { json } from "../_shared/http.ts";

async function clientIdForCustomer(admin, customerId, metadataUserId) {
    if (metadataUserId) return metadataUserId;
    if (!customerId) return null;
    const id = typeof customerId === "string" ? customerId : customerId.id;
    const { data } = await admin.from("profiles").select("id").eq("stripe_customer_id", id).maybeSingle();
    return data?.id || null;
}

async function upsertSubscription(admin, subscription) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    const clientId = await clientIdForCustomer(admin, customerId, subscription.metadata?.supabase_user_id);
    const priceId = subscriptionPriceId(subscription);
    let planId = null;
    if (priceId) {
        const { data: plan } = await admin.from("service_plans").select("id").eq("stripe_price_id", priceId).maybeSingle();
        planId = plan?.id || null;
    }
    const bounds = periodBounds(subscription);
    const patch = {
        plan_id: planId,
        status: subscription.status,
        current_period_start: bounds.current_period_start,
        current_period_end: bounds.current_period_end,
    };

    const { data: existing } = await admin
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

    if (existing) {
        const { error } = await admin.from("subscriptions").update(patch).eq("id", existing.id);
        if (error) throw new Error(error.message);
        return;
    }
    if (!clientId) return;

    const { error } = await admin.from("subscriptions").insert({
        ...patch,
        client_id: clientId,
        stripe_subscription_id: subscription.id,
    });
    if (error) throw new Error(error.message);
}

async function recordPayment(admin, { clientId, invoiceId, paymentIntentId, amountCents, status }) {
    if (!clientId || amountCents == null) return;
    if (paymentIntentId) {
        const { data: existing } = await admin
            .from("payments")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();
        if (existing) return;
    }
    const { error } = await admin.from("payments").insert({
        client_id: clientId,
        invoice_id: invoiceId,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: amountCents,
        status: status || "succeeded",
    });
    if (error) throw new Error(error.message);
}

async function syncInvoice(admin, invoice) {
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    const clientId = await clientIdForCustomer(admin, customerId, invoice.metadata?.supabase_user_id);
    const status = mapInvoiceStatus(invoice.status);
    const patch = {
        amount_cents: invoice.amount_due ?? invoice.total ?? 0,
        status,
        paid_at: status === "paid" ? (unixToIso(invoice.status_transitions?.paid_at) || new Date().toISOString()) : null,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        description: invoice.description,
    };

    const { data: existing } = await admin
        .from("invoices")
        .select("id, client_id, status")
        .eq("stripe_invoice_id", invoice.id)
        .maybeSingle();

    if (existing?.status === "paid" && status !== "paid" && status !== "void") {
        return;
    }

    let invoiceRowId = existing?.id || null;
    const ownerId = existing?.client_id || clientId;
    if (existing) {
        const { error } = await admin.from("invoices").update(patch).eq("id", existing.id);
        if (error) throw new Error(error.message);
    } else if (clientId) {
        const { data, error } = await admin
            .from("invoices")
            .insert({
                ...patch,
                client_id: clientId,
                stripe_invoice_id: invoice.id,
                due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString().slice(0, 10) : null,
            })
            .select("id")
            .single();
        if (error) throw new Error(error.message);
        invoiceRowId = data.id;
    }

    if (status === "paid" && ownerId) {
        const paymentIntentId = typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : invoice.payment_intent?.id || null;
        await recordPayment(admin, {
            clientId: ownerId,
            invoiceId: invoiceRowId,
            paymentIntentId,
            amountCents: invoice.amount_paid ?? patch.amount_cents,
            status: "succeeded",
        });
    }
}

Deno.serve(async (req) => {
    try {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

        const signature = req.headers.get("stripe-signature");
        const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        if (!signature || !secret) return json({ error: "Webhook is not configured" }, 500);

        const stripe = stripeClient();
        let event;
        try {
            const body = await req.text();
            event = await stripe.webhooks.constructEventAsync(body, signature, secret);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid signature";
            return json({ error: message }, 400);
        }

    const admin = adminClient();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const clientId = session.metadata?.supabase_user_id || session.client_reference_id;
                if (session.mode === "subscription" && session.subscription) {
                    const subscriptionId = typeof session.subscription === "string"
                        ? session.subscription
                        : session.subscription.id;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    if (clientId) subscription.metadata = { ...subscription.metadata, supabase_user_id: clientId };
                    await upsertSubscription(admin, subscription);
                }
                if (session.mode === "payment" && session.metadata?.invoice_id && clientId) {
                    await admin
                        .from("invoices")
                        .update({ status: "paid", paid_at: new Date().toISOString() })
                        .eq("id", session.metadata.invoice_id)
                        .eq("client_id", clientId);
                    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
                    await recordPayment(admin, {
                        clientId,
                        invoiceId: session.metadata.invoice_id,
                        paymentIntentId,
                        amountCents: session.amount_total,
                        status: "succeeded",
                    });
                }
                if (session.mode === "payment" && !session.metadata?.invoice_id && clientId) {
                    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
                    await recordPayment(admin, {
                        clientId,
                        invoiceId: null,
                        paymentIntentId,
                        amountCents: session.amount_total,
                        status: "succeeded",
                    });
                }
                break;
            }
            case "invoice.paid":
            case "invoice.payment_failed":
            case "invoice.finalized":
            case "invoice.voided":
                await syncInvoice(admin, event.data.object);
                break;
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                if (event.type === "customer.subscription.deleted") subscription.status = "canceled";
                await upsertSubscription(admin, subscription);
                break;
            }
            default:
                break;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Webhook handler failed";
        return json({ error: message }, 500);
    }

    return json({ received: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Webhook failed";
        return json({ error: message }, 500);
    }
});
