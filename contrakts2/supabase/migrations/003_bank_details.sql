alter table users
  add column if not exists paystack_recipient_code text,
  add column if not exists bank_account_number text,
  add column if not exists bank_code text,
  add column if not exists bank_name text,
  add column if not exists wallet_address text,
  add column if not exists preferred_payout text not null default 'fiat';

alter table users
  drop constraint if exists users_preferred_payout_check;

alter table users
  add constraint users_preferred_payout_check
  check (preferred_payout in ('fiat', 'crypto'));

alter table contracts
  add column if not exists payment_method text not null default 'fiat';

alter table contracts
  drop constraint if exists contracts_payment_method_check;

alter table contracts
  add constraint contracts_payment_method_check
  check (payment_method in ('fiat', 'crypto'));

alter table payments
  drop constraint if exists payments_provider_check;

alter table payments
  add constraint payments_provider_check
  check (provider in ('paystack', 'flutterwave', 'coinbase_commerce'));

drop policy if exists payments_select_party on payments;

create policy payments_select_party on payments for select
using (
  exists (
    select 1
    from contracts c
    where c.id = contract_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

create index if not exists idx_payments_provider_ref on payments(provider_ref);

create or replace function release_milestone_payment_internal(p_milestone_id uuid)
returns void language plpgsql security definer as $$
begin
  update milestones
  set
    state = 'approved',
    approved_at = now(),
    auto_released = true
  where id = p_milestone_id
    and state = 'submitted';
end;
$$;

create or replace function auto_release_milestones()
returns void language plpgsql security definer as $$
declare
  milestone_record record;
begin
  for milestone_record in
    select m.id
    from milestones m
    join contracts c on c.id = m.contract_id
    where m.state = 'submitted'
      and m.submitted_at < now() - interval '72 hours'
      and c.state in ('active', 'in_review')
  loop
    perform release_milestone_payment_internal(milestone_record.id);
  end loop;
end;
$$;

 
