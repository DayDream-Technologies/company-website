-- Client portal schema: profiles, projects, plans, subscriptions, invoices, payments.
-- Apply with: npx supabase db push
-- Promote the first admin after signup:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    company text,
    role text not null default 'client' check (role in ('client', 'admin')),
    stripe_customer_id text unique,
    created_at timestamptz not null default now()
);

create table public.projects (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.profiles (id) on delete cascade,
    name text not null,
    description text,
    status text not null default 'active' check (status in ('active', 'completed', 'paused')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.service_plans (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    stripe_price_id text unique,
    description text,
    price_cents integer not null check (price_cents >= 0),
    interval text not null check (interval in ('month', 'year', 'one_time')),
    features jsonb not null default '[]'::jsonb,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.profiles (id) on delete cascade,
    stripe_subscription_id text unique,
    plan_id uuid references public.service_plans (id) on delete set null,
    status text not null,
    current_period_start timestamptz,
    current_period_end timestamptz,
    created_at timestamptz not null default now()
);

create table public.invoices (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.profiles (id) on delete cascade,
    stripe_invoice_id text unique,
    amount_cents integer not null check (amount_cents >= 0),
    status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
    due_date date,
    paid_at timestamptz,
    description text,
    hosted_invoice_url text,
    invoice_pdf text,
    created_at timestamptz not null default now()
);

create table public.payments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.profiles (id) on delete cascade,
    invoice_id uuid references public.invoices (id) on delete set null,
    stripe_payment_intent_id text unique,
    amount_cents integer not null check (amount_cents >= 0),
    status text not null,
    created_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);
create index subscriptions_client_id_idx on public.subscriptions (client_id);
create index invoices_client_id_idx on public.invoices (client_id);
create index payments_client_id_idx on public.payments (client_id);
create index payments_invoice_id_idx on public.payments (invoice_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger projects_set_updated_at
    before update on public.projects
    for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, company)
    values (
        new.id,
        nullif(new.raw_user_meta_data->>'full_name', ''),
        nullif(new.raw_user_meta_data->>'company', '')
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Service-role and SQL migrations have no end-user JWT. Let those through.
    if auth.uid() is null then
        return new;
    end if;

    if not public.is_admin() then
        new.role = old.role;
        new.stripe_customer_id = old.stripe_customer_id;
        new.id = old.id;
    end if;

    return new;
end;
$$;

create trigger profiles_protect_fields
    before update on public.profiles
    for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from public, anon;
revoke all on table public.projects from public, anon;
revoke all on table public.service_plans from public, anon;
revoke all on table public.subscriptions from public, anon;
revoke all on table public.invoices from public, anon;
revoke all on table public.payments from public, anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.service_plans to authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.invoices to authenticated;
grant select on table public.payments to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.projects to service_role;
grant all on table public.service_plans to service_role;
grant all on table public.subscriptions to service_role;
grant all on table public.invoices to service_role;
grant all on table public.payments to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.service_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

alter table public.profiles force row level security;
alter table public.projects force row level security;
alter table public.service_plans force row level security;
alter table public.subscriptions force row level security;
alter table public.invoices force row level security;
alter table public.payments force row level security;

create policy profiles_select_own_or_admin
    on public.profiles
    for select
    to authenticated
    using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
    on public.profiles
    for update
    to authenticated
    using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());

create policy projects_select_own_or_admin
    on public.projects
    for select
    to authenticated
    using (client_id = auth.uid() or public.is_admin());

create policy projects_insert_admin
    on public.projects
    for insert
    to authenticated
    with check (public.is_admin());

create policy projects_update_admin
    on public.projects
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create policy projects_delete_admin
    on public.projects
    for delete
    to authenticated
    using (public.is_admin());

create policy service_plans_select_authenticated
    on public.service_plans
    for select
    to authenticated
    using (true);

create policy service_plans_write_admin
    on public.service_plans
    for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create policy subscriptions_select_own_or_admin
    on public.subscriptions
    for select
    to authenticated
    using (client_id = auth.uid() or public.is_admin());

create policy invoices_select_own_or_admin
    on public.invoices
    for select
    to authenticated
    using (client_id = auth.uid() or public.is_admin());

create policy payments_select_own_or_admin
    on public.payments
    for select
    to authenticated
    using (client_id = auth.uid() or public.is_admin());
