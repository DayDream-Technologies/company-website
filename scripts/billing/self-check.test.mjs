import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mapInvoiceStatus, periodBounds, subscriptionPriceId, unixToIso } from '../../supabase/functions/_shared/billing-map.mjs';

test('invoice statuses map onto the portal vocabulary', () => {
    assert.equal(mapInvoiceStatus('draft'), 'draft');
    assert.equal(mapInvoiceStatus('open'), 'sent');
    assert.equal(mapInvoiceStatus('paid'), 'paid');
    assert.equal(mapInvoiceStatus('void'), 'void');
    assert.equal(mapInvoiceStatus('uncollectible'), 'void');
    assert.equal(mapInvoiceStatus('something-new'), 'sent');
});

test('subscription period falls back to the first item', () => {
    const bounds = periodBounds({
        items: { data: [{ current_period_start: 1_700_000_000, current_period_end: 1_702_592_000, price: { id: 'price_123' } }] },
    });
    assert.equal(bounds.current_period_start, new Date(1_700_000_000 * 1000).toISOString());
    assert.equal(bounds.current_period_end, new Date(1_702_592_000 * 1000).toISOString());
    assert.equal(subscriptionPriceId({
        items: { data: [{ price: { id: 'price_123' } }] },
    }), 'price_123');
    assert.equal(unixToIso(null), null);
});

test('schema and pages include the billing surface', async () => {
    const schema = await readFile(new URL('../../supabase/migrations/001_initial_schema.sql', import.meta.url), 'utf8');
    for (const table of ['profiles', 'projects', 'service_plans', 'subscriptions', 'invoices', 'payments']) {
        assert.match(schema, new RegExp(`create table public\\.${table}`));
    }
    assert.match(schema, /on_auth_user_created/);
    assert.match(schema, /enable row level security/);

    const seed = await readFile(new URL('../../supabase/migrations/002_seed_service_plans.sql', import.meta.url), 'utf8');
    assert.match(seed, /Website Care/);
    assert.match(seed, /Project Deposit/);

    const login = await readFile(new URL('../../login.html', import.meta.url), 'utf8');
    assert.match(login, /id="auth-form"/);
    const dashboard = await readFile(new URL('../../dashboard.html', import.meta.url), 'utf8');
    assert.match(dashboard, /panel-invoices/);
    const admin = await readFile(new URL('../../admin.html', import.meta.url), 'utf8');
    assert.match(admin, /id="invoice-form"/);
});
