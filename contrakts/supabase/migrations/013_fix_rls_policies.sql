-- Add missing INSERT policy for milestones (contract initiator can add milestones)
create policy "milestones_insert_party" on milestones for insert
  with check (
    exists (
      select 1 from contracts c
      where c.id = contract_id
        and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
    )
  );

-- Add missing INSERT policy for audit_log (any authenticated user can insert their own logs)
create policy "audit_log_insert_actor" on audit_log for insert
  with check (auth.uid() = actor_id);

-- Fix initiator_role constraint: code uses 'vendor', not 'service_provider'
alter table contracts drop constraint if exists contracts_initiator_role_check;
alter table contracts add constraint contracts_initiator_role_check
  check (initiator_role in ('vendor', 'service_receiver'));
