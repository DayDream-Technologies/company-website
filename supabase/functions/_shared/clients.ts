import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

export function adminClient() {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Supabase service credentials are not configured");
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

export function stripeClient() {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    return new Stripe(key, {
        httpClient: Stripe.createFetchHttpClient(),
    });
}

export async function requireUser(req) {
    const header = req.headers.get("Authorization") || "";
    const token = header.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Missing authorization");

    const admin = adminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) throw new Error("Unauthorized");
    return { user: data.user, admin };
}

export async function requireAdmin(req) {
    const ctx = await requireUser(req);
    const { data, error } = await ctx.admin
        .from("profiles")
        .select("role")
        .eq("id", ctx.user.id)
        .single();
    if (error || !data || data.role !== "admin") throw new Error("Forbidden");
    return ctx;
}

export async function ensureStripeCustomer(stripe, admin, profile, email) {
    if (profile.stripe_customer_id) return profile.stripe_customer_id;

    const customer = await stripe.customers.create({
        email,
        name: profile.full_name || undefined,
        metadata: { supabase_user_id: profile.id },
    });

    const { error } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", profile.id);
    if (error) throw new Error(error.message);
    return customer.id;
}
