-- ════════════════════════════════════════════════
-- 012 — Bilateral Negotiation Support
-- Adapted to the current Contrakts schema:
--   - initiator_id / counterparty_id
--   - state (not status)
-- ════════════════════════════════════════════════

-- 1. Add bilateral negotiation columns to contracts
alter table contracts
  add column if not exists initiator_role text
    check (initiator_role in ('service_provider', 'service_receiver'))
    default 'service_receiver',
  add column if not exists service_provider_id uuid
    references users(id),
  add column if not exists service_receiver_id uuid
    references users(id),
  add column if not exists negotiation_status text
    check (
      negotiation_status in (
        'draft',
        'pending_review',
        'in_review',
        'countered',
        'accepted',
        'rejected',
        'expired'
      )
    )
    default 'draft',
  add column if not exists current_reviewer_id uuid
    references users(id),
  add column if not exists review_round integer not null default 0,
  add column if not exists terms_locked boolean not null default false,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists signed_by_receiver boolean not null default false,
  add column if not exists signed_by_provider boolean not null default false,
  add column if not exists receiver_signed_at timestamptz,
  add column if not exists provider_signed_at timestamptz,
  add column if not exists receiver_signature text,
  add column if not exists provider_signature text,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Backfill existing contracts from the legacy unilateral model.
-- Old assumption: initiator created as payer / service receiver,
-- counterparty fulfilled as service provider.
update contracts
set
  service_receiver_id = coalesce(service_receiver_id, initiator_id),
  service_provider_id = coalesce(service_provider_id, counterparty_id),
  initiator_role = coalesce(initiator_role, 'service_receiver'),
  negotiation_status = case
    when state = 'draft' then 'draft'
    when state = 'pending' and signed_counterparty_at is null then 'pending_review'
    when state in (
      'pending',
      'funded',
      'active',
      'in_review',
      'disputed',
      'complete',
      'voided'
    ) then 'accepted'
    else coalesce(negotiation_status, 'draft')
  end,
  current_reviewer_id = case
    when state = 'pending' and signed_counterparty_at is null then counterparty_id
    else current_reviewer_id
  end,
  signed_by_receiver = coalesce(signed_by_receiver, signed_initiator_at is not null),
  signed_by_provider = coalesce(signed_by_provider, signed_counterparty_at is not null),
  receiver_signed_at = coalesce(receiver_signed_at, signed_initiator_at),
  provider_signed_at = coalesce(provider_signed_at, signed_counterparty_at),
  accepted_at = case
    when accepted_at is not null then accepted_at
    when signed_counterparty_at is not null then signed_counterparty_at
    else accepted_at
  end,
  terms_locked = case
    when terms_locked then true
    when signed_initiator_at is not null and signed_counterparty_at is not null then true
    when state in ('funded', 'active', 'in_review', 'disputed', 'complete', 'voided') then true
    else false
  end,
  updated_at = coalesce(updated_at, created_at)
where service_receiver_id is null
   or service_provider_id is null
   or initiator_role is null
   or negotiation_status is null
   or receiver_signed_at is null
   or provider_signed_at is null;

-- 3. Expand the state constraint for the negotiation flow while keeping
-- legacy values for backwards compatibility during rollout.
alter table contracts
  drop constraint if exists contracts_state_check;

alter table contracts
  add constraint contracts_state_check
  check (
    state in (
      'draft',
      'pending',
      'pending_review',
      'in_review',
      'countered',
      'accepted',
      'signing',
      'signed',
      'funding',
      'funded',
      'active',
      'complete',
      'completed',
      'disputed',
      'voided',
      'cancelled',
      'expired'
    )
  );

create index if not exists idx_contracts_service_provider_id
  on contracts(service_provider_id);

create index if not exists idx_contracts_service_receiver_id
  on contracts(service_receiver_id);

create index if not exists idx_contracts_negotiation_status
  on contracts(negotiation_status);

create index if not exists idx_contracts_current_reviewer_id
  on contracts(current_reviewer_id);

create or replace function set_contracts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contracts_updated_at on contracts;

create trigger trg_contracts_updated_at
before update on contracts
for each row execute function set_contracts_updated_at();

-- ════════════════════════════════════════════════
-- CONTRACT REVIEWS TABLE
-- ════════════════════════════════════════════════
create table if not exists contract_reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  reviewer_id uuid not null references users(id),
  reviewer_role text not null
    check (reviewer_role in ('service_provider', 'service_receiver')),
  round integer not null default 1,
  action text not null
    check (action in ('initial_draft', 'review_edit', 'counter_offer', 'accept', 'reject')),
  terms_snapshot jsonb not null default '{}'::jsonb,
  milestones_snapshot jsonb not null default '[]'::jsonb,
  changes_summary jsonb not null default '[]'::jsonb,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_reviews_contract
  on contract_reviews(contract_id, round desc);

create index if not exists idx_contract_reviews_reviewer
  on contract_reviews(reviewer_id);

-- ════════════════════════════════════════════════
-- MILESTONE EDIT HISTORY
-- ════════════════════════════════════════════════
create table if not exists milestone_edits (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references contract_reviews(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,
  field_name text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_milestone_edits_review
  on milestone_edits(review_id);

-- ════════════════════════════════════════════════
-- EDITABILITY TRACKING ON MILESTONES
-- ════════════════════════════════════════════════
alter table milestones
  add column if not exists is_locked boolean not null default false,
  add column if not exists last_edited_by uuid references users(id),
  add column if not exists last_edited_at timestamptz;

-- ════════════════════════════════════════════════
-- RLS POLICIES
-- ════════════════════════════════════════════════
alter table contract_reviews enable row level security;
alter table milestone_edits enable row level security;

drop policy if exists "contract_reviews_select_party" on contract_reviews;
create policy "contract_reviews_select_party"
on contract_reviews for select
using (
  exists (
    select 1
    from contracts c
    where c.id = contract_id
      and (
        c.initiator_id = auth.uid()
        or c.counterparty_id = auth.uid()
        or c.service_provider_id = auth.uid()
        or c.service_receiver_id = auth.uid()
      )
  )
);

drop policy if exists "contract_reviews_insert_party" on contract_reviews;
create policy "contract_reviews_insert_party"
on contract_reviews for insert
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from contracts c
    where c.id = contract_id
      and (
        c.initiator_id = auth.uid()
        or c.counterparty_id = auth.uid()
        or c.service_provider_id = auth.uid()
        or c.service_receiver_id = auth.uid()
      )
  )
);

drop policy if exists "milestone_edits_select_party" on milestone_edits;
create policy "milestone_edits_select_party"
on milestone_edits for select
using (
  exists (
    select 1
    from contract_reviews cr
    join contracts c on c.id = cr.contract_id
    where cr.id = review_id
      and (
        c.initiator_id = auth.uid()
        or c.counterparty_id = auth.uid()
        or c.service_provider_id = auth.uid()
        or c.service_receiver_id = auth.uid()
      )
  )
);

drop policy if exists "milestone_edits_insert_reviewer" on milestone_edits;
create policy "milestone_edits_insert_reviewer"
on milestone_edits for insert
with check (
  exists (
    select 1
    from contract_reviews cr
    where cr.id = review_id
      and cr.reviewer_id = auth.uid()
  )
);

-- Refresh contract party policies to include the new explicit role columns.
drop policy if exists "contracts_select_party" on contracts;
create policy "contracts_select_party"
on contracts for select
using (
  initiator_id = auth.uid()
  or counterparty_id = auth.uid()
  or service_provider_id = auth.uid()
  or service_receiver_id = auth.uid()
);

drop policy if exists "contracts_update_party" on contracts;
create policy "contracts_update_party"
on contracts for update
using (
  initiator_id = auth.uid()
  or counterparty_id = auth.uid()
  or service_provider_id = auth.uid()
  or service_receiver_id = auth.uid()
)
with check (
  initiator_id = auth.uid()
  or counterparty_id = auth.uid()
  or service_provider_id = auth.uid()
  or service_receiver_id = auth.uid()
);

grant all on contract_reviews to authenticated;
grant all on milestone_edits to authenticated;
