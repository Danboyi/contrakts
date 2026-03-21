create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  scopes text[] not null default array['contracts:read'],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists webhook_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  url text not null,
  events text[] not null,
  secret text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists webhook_deliveries (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid not null references webhook_subscriptions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  response_status int,
  response_body text,
  attempt_count int not null default 1,
  delivered_at timestamptz,
  failed_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);

alter table api_keys enable row level security;
alter table webhook_subscriptions enable row level security;
alter table webhook_deliveries enable row level security;

create policy "api_keys_own"
on api_keys
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "webhook_subs_own"
on webhook_subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "webhook_deliveries_own"
on webhook_deliveries
for select
using (
  exists (
    select 1
    from webhook_subscriptions s
    where s.id = subscription_id
      and s.user_id = auth.uid()
  )
);

create index if not exists idx_api_keys_hash
  on api_keys(key_hash);

create index if not exists idx_api_keys_user
  on api_keys(user_id);

create index if not exists idx_webhook_subs_user
  on webhook_subscriptions(user_id);

create index if not exists idx_webhook_del_sub
  on webhook_deliveries(subscription_id);
