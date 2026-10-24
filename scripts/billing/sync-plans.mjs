/**
 * Creates Stripe Products and Prices for service_plans that do not yet have a stripe_price_id,
 * then writes the ids back to Supabase.
 *
 * Required env (see .env.example):
 *   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Without those, this prints the catalog and the Stripe Dashboard steps.
 */
import { readFile } from 'node:fs/promises';

const PLANS = [
    { id: 'a1b2c3d4-e5f6-4789-a111-111111111111', name: 'Website Care', interval: 'month' },
    { id: 'a1b2c3d4-e5f6-4789-a222-222222222222', name: 'Growth Retainer', interval: 'month' },
    { id: 'a1b2c3d4-e5f6-4789-a333-333333333333', name: 'AI Search Optimization', interval: 'month' },
    { id: 'a1b2c3d4-e5f6-4789-a444-444444444444', name: 'Project Deposit', interval: 'one_time' },
];

function loadDotEnv(text) {
    const env = {};
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
    return env;
}

async function stripeForm(stripeKey, path, params) {
    const response = await fetch('https://api.stripe.com/v1' + path, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + stripeKey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
    });
    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.error ? body.error.message : 'Stripe request failed');
    }
    return body;
}

async function main() {
    let fileEnv = {};
    try {
        fileEnv = loadDotEnv(await readFile(new URL('../../.env', import.meta.url), 'utf8'));
    } catch {
        fileEnv = {};
    }
    const env = { ...fileEnv, ...process.env };
    const stripeKey = env.STRIPE_SECRET_KEY || '';
    const supabaseUrl = env.SUPABASE_URL || '';
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
    const ready = stripeKey.startsWith('sk_') && supabaseUrl.startsWith('https://') && serviceKey.length > 20;

    if (!ready) {
        console.log('Stripe plans are seeded in supabase/migrations/002_seed_service_plans.sql.');
        console.log('To attach live Stripe price ids, set STRIPE_SECRET_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY, then run:');
        console.log('  node scripts/billing/sync-plans.mjs');
        console.log('In the Stripe Dashboard, also turn on the Customer Portal and allow plan switching between these prices:');
        for (const plan of PLANS) console.log('  - ' + plan.name + ' (' + plan.interval + ')');
        console.log('Webhook endpoint: <supabase-url>/functions/v1/stripe-webhook');
        console.log('Events: checkout.session.completed, invoice.paid, invoice.payment_failed, invoice.finalized, invoice.voided, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted');
        return;
    }

    const listed = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/service_plans?select=id,name,description,price_cents,interval,stripe_price_id', {
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
    });
    if (!listed.ok) throw new Error('Could not read service_plans: ' + listed.status);
    const rows = await listed.json();

    for (const plan of rows) {
        if (plan.stripe_price_id) {
            console.log(plan.name + ' already linked to ' + plan.stripe_price_id);
            continue;
        }
        const product = await stripeForm(stripeKey, '/products', {
            name: plan.name,
            description: plan.description || plan.name,
        });
        const priceParams = {
            product: product.id,
            unit_amount: String(plan.price_cents),
            currency: 'usd',
        };
        if (plan.interval !== 'one_time') priceParams['recurring[interval]'] = plan.interval;
        const price = await stripeForm(stripeKey, '/prices', priceParams);
        const saved = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/service_plans?id=eq.' + plan.id, {
            method: 'PATCH',
            headers: {
                apikey: serviceKey,
                Authorization: 'Bearer ' + serviceKey,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
            },
            body: JSON.stringify({ stripe_price_id: price.id }),
        });
        if (!saved.ok) throw new Error('Could not save price for ' + plan.name);
        console.log(plan.name + ' -> ' + price.id);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
