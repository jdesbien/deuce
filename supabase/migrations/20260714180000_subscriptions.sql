-- Cards4Couples Pro (ad-free) subscriptions. Stripe is the source of
-- truth; the webhook writes state here with the service role. Clients
-- may only read their own row — entitlement is never client-written.

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  -- Stripe subscription status: active, trialing, past_due, canceled, …
  status text not null default 'inactive',
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: users read their own"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Deliberately no insert/update/delete policies: only the service role
-- (used by the Stripe webhook and checkout route) writes rows.

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
