-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS
create table users (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text not null,
  email            text unique not null,
  phone            text,
  avatar_url       text,
  kyc_status       text not null default 'unverified' check (kyc_status in ('unverified','pending','verified')),
  trust_score      numeric not null default 100,
  total_contracts  int not null default 0,
  completed_count  int not null default 0,
  dispute_count    int not null default 0,
  created_at       timestamptz not null default now()
);

-- CONTRACTS
create table contracts (
  id                         uuid primary key default uuid_generate_v4(),
  ref_code                   text unique not null,
  title                      text not null,
  description                text,
  initiator_id               uuid not null references users(id),
  counterparty_id            uuid references users(id),
  invite_token               text unique,
  industry                   text not null default 'other',
  state                      text not null default 'draft' check (state in ('draft','pending','funded','active','in_review','disputed','complete','voided')),
  currency                   text not null default 'USD',
  total_value                bigint not null,
  platform_fee_pct           numeric not null default 2.0,
  platform_fee               bigint,
  start_date                 date,
  end_date                   date,
  terms                      text,
  signed_initiator_at        timestamptz,
  signed_counterparty_at     timestamptz,
  funded_at                  timestamptz,
  completed_at               timestamptz,
  created_at                 timestamptz not null default now()
);

-- MILESTONES
create table milestones (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid not null references contracts(id) on delete cascade,
  order_index     int not null,
  title           text not null,
  description     text,
  amount          bigint not null,
  state           text not null default 'pending' check (state in ('pending','in_progress','submitted','disputed','approved','paid')),
  deadline        timestamptz,
  submitted_at    timestamptz,
  approved_at     timestamptz,
  paid_at         timestamptz,
  auto_released   boolean not null default false,
  created_at      timestamptz not null default now()
);

-- DELIVERABLES
create table deliverables (
  id              uuid primary key default uuid_generate_v4(),
  milestone_id    uuid not null references milestones(id) on delete cascade,
  submitted_by    uuid not null references users(id),
  file_url        text,
  file_name       text,
  file_type       text,
  note            text,
  created_at      timestamptz not null default now()
);

-- PAYMENTS
create table payments (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid not null references contracts(id),
  milestone_id    uuid references milestones(id),
  payment_type    text not null check (payment_type in ('escrow_deposit','milestone_release','refund','platform_fee')),
  provider        text not null check (provider in ('paystack','flutterwave')),
  provider_ref    text,
  provider_status text not null default 'pending' check (provider_status in ('pending','success','failed')),
  gross_amount    bigint not null,
  fee_amount      bigint not null default 0,
  net_amount      bigint not null,
  currency        text not null,
  recipient_id    uuid references users(id),
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

-- DISPUTES
create table disputes (
  id                  uuid primary key default uuid_generate_v4(),
  contract_id         uuid not null references contracts(id),
  milestone_id        uuid not null references milestones(id),
  raised_by           uuid not null references users(id),
  respondent_id       uuid not null references users(id),
  status              text not null default 'open' check (status in ('open','awaiting_response','under_review','clarification','resolved','appealed')),
  reason              text not null check (reason in ('scope_mismatch','non_delivery','quality','payment_delay','other')),
  description         text not null,
  ruling              text check (ruling in ('vendor_wins','client_wins','partial','cancelled')),
  ruling_notes        text,
  ruling_pct_vendor   numeric,
  arbitrator_id       uuid references users(id),
  dispute_fee_paid    boolean not null default false,
  raised_at           timestamptz not null default now(),
  response_due_at     timestamptz not null,
  resolved_at         timestamptz
);

-- DISPUTE EVIDENCE
create table dispute_evidence (
  id              uuid primary key default uuid_generate_v4(),
  dispute_id      uuid not null references disputes(id) on delete cascade,
  submitted_by    uuid not null references users(id),
  file_url        text,
  file_name       text,
  description     text,
  created_at      timestamptz not null default now()
);

-- AUDIT LOG
create table audit_log (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid references contracts(id),
  actor_id        uuid references users(id),
  event_type      text not null,
  payload         jsonb,
  ip_address      text,
  created_at      timestamptz not null default now()
);

-- NOTIFICATIONS
create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  contract_id     uuid references contracts(id),
  type            text not null,
  title           text not null,
  body            text not null,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ROW LEVEL SECURITY
alter table users               enable row level security;
alter table contracts           enable row level security;
alter table milestones          enable row level security;
alter table deliverables        enable row level security;
alter table payments            enable row level security;
alter table disputes            enable row level security;
alter table dispute_evidence    enable row level security;
alter table audit_log           enable row level security;
alter table notifications       enable row level security;

-- RLS POLICIES
-- Users: can only read/update own profile
create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- Contracts: party access only
create policy "contracts_select_party" on contracts for select
  using (auth.uid() = initiator_id or auth.uid() = counterparty_id);
create policy "contracts_insert_initiator" on contracts for insert
  with check (auth.uid() = initiator_id);
create policy "contracts_update_party" on contracts for update
  using (auth.uid() = initiator_id or auth.uid() = counterparty_id);

-- Milestones: inherit contract party access
create policy "milestones_select_party" on milestones for select
  using (exists (select 1 from contracts c where c.id = contract_id and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())));
create policy "milestones_update_party" on milestones for update
  using (exists (select 1 from contracts c where c.id = contract_id and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())));

-- Notifications: own only
create policy "notifications_select_own" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INDEXES
create index idx_contracts_initiator    on contracts(initiator_id);
create index idx_contracts_counterparty on contracts(counterparty_id);
create index idx_contracts_state        on contracts(state);
create index idx_contracts_invite_token on contracts(invite_token);
create index idx_milestones_contract    on milestones(contract_id);
create index idx_milestones_state       on milestones(state);
create index idx_payments_contract      on payments(contract_id);
create index idx_disputes_contract      on disputes(contract_id);
create index idx_audit_log_contract     on audit_log(contract_id);
create index idx_notifications_user     on notifications(user_id, read);
