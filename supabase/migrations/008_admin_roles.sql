create table if not exists admin_users (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'arbitrator'
    check (role in ('arbitrator', 'admin', 'superadmin')),
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table admin_users enable row level security;

drop policy if exists "admin_users_service_only" on admin_users;
create policy "admin_users_service_only"
on admin_users for all
using (false)
with check (false);

create table if not exists fraud_flags (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references contracts(id),
  user_id uuid references users(id),
  flagged_by uuid not null references users(id),
  reason text not null,
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high')),
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  notes text,
  created_at timestamptz not null default now()
);

alter table fraud_flags enable row level security;

drop policy if exists "fraud_flags_service_only" on fraud_flags;
create policy "fraud_flags_service_only"
on fraud_flags for all
using (false)
with check (false);

create or replace view platform_metrics as
select
  (select count(*) from contracts) as total_contracts,
  (select count(*) from contracts where state = 'active') as active_contracts,
  (select count(*) from contracts where state = 'complete') as completed_contracts,
  (select count(*) from contracts where state = 'disputed') as disputed_contracts,
  (
    select count(*)
    from disputes
    where status in ('open', 'awaiting_response', 'under_review')
  ) as open_disputes,
  (select count(*) from users) as total_users,
  (
    select coalesce(sum(net_amount), 0)
    from payments
    where payment_type = 'platform_fee'
      and provider_status = 'success'
  ) as total_revenue,
  (
    select coalesce(sum(gross_amount), 0)
    from payments
    where payment_type = 'escrow_deposit'
      and provider_status = 'success'
  ) as total_escrow_volume;
