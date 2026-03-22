-- Add 'negotiating' state to contracts
alter table contracts drop constraint contracts_state_check;
alter table contracts add constraint contracts_state_check
  check (state in ('draft','pending','negotiating','funded','active','in_review','disputed','complete','voided'));

-- Add initiator_role column to contracts
alter table contracts
  add column if not exists initiator_role text not null default 'service_receiver'
  check (initiator_role in ('service_provider','service_receiver'));

-- NEGOTIATION ROUNDS
create table contract_negotiations (
  id                uuid primary key default uuid_generate_v4(),
  contract_id       uuid not null references contracts(id) on delete cascade,
  round_number      int not null,
  submitted_by      uuid not null references users(id),
  status            text not null default 'pending_review'
                    check (status in ('pending_review','reviewed','countered','accepted')),
  changes_summary   text,
  milestone_changes jsonb,
  terms_changes     text,
  created_at        timestamptz not null default now(),
  responded_at      timestamptz
);

-- Indexes
create index idx_negotiations_contract on contract_negotiations(contract_id);
create index idx_negotiations_submitted_by on contract_negotiations(submitted_by);

-- RLS
alter table contract_negotiations enable row level security;

-- Users can read negotiations for contracts they are part of
create policy "Users can read own contract negotiations"
  on contract_negotiations for select using (
    exists (
      select 1 from contracts c
      where c.id = contract_negotiations.contract_id
        and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
    )
  );

-- Users can insert negotiations for contracts they are part of
create policy "Users can insert negotiations for own contracts"
  on contract_negotiations for insert with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from contracts c
      where c.id = contract_negotiations.contract_id
        and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
    )
  );
