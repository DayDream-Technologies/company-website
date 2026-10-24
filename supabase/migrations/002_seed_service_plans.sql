-- Catalog of client plans. stripe_price_id is filled by scripts/billing/sync-plans.mjs
-- after the matching Price exists in Stripe.

insert into public.service_plans (id, name, description, price_cents, interval, features)
values
    (
        'a1b2c3d4-e5f6-4789-a111-111111111111',
        'Website Care',
        'Hosting, security updates, and a monthly health report for an existing site.',
        14900,
        'month',
        '["Managed hosting","Security updates","Monthly report"]'::jsonb
    ),
    (
        'a1b2c3d4-e5f6-4789-a222-222222222222',
        'Growth Retainer',
        'Website Care plus a block of design and development time each month.',
        49900,
        'month',
        '["Everything in Website Care","Monthly design and development","Priority response"]'::jsonb
    ),
    (
        'a1b2c3d4-e5f6-4789-a333-333333333333',
        'AI Search Optimization',
        'Ongoing structured data, content, and citation work so AI search tools can recommend you.',
        29900,
        'month',
        '["Structured data","Content updates","Citation building"]'::jsonb
    ),
    (
        'a1b2c3d4-e5f6-4789-a444-444444444444',
        'Project Deposit',
        'One-time deposit to start a scoped project. The remainder is invoiced as work is delivered.',
        150000,
        'one_time',
        '["Kicks off a scoped project","Applied to the project invoice"]'::jsonb
    );
