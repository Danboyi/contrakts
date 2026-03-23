drop policy if exists "disputes_select_party" on public.disputes;
create policy "disputes_select_party"
on public.disputes for select
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
  or raised_by = auth.uid()
  or respondent_id = auth.uid()
);

drop policy if exists "disputes_insert_party" on public.disputes;
create policy "disputes_insert_party"
on public.disputes for insert
with check (
  raised_by = auth.uid()
  and exists (
    select 1
    from public.contracts c
    where c.id = contract_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "disputes_update_party" on public.disputes;
create policy "disputes_update_party"
on public.disputes for update
using (
  raised_by = auth.uid()
  or respondent_id = auth.uid()
  or exists (
    select 1
    from public.contracts c
    where c.id = contract_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
)
with check (
  raised_by = auth.uid()
  or respondent_id = auth.uid()
  or exists (
    select 1
    from public.contracts c
    where c.id = contract_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "dispute_evidence_select_party" on public.dispute_evidence;
create policy "dispute_evidence_select_party"
on public.dispute_evidence for select
using (
  exists (
    select 1
    from public.disputes d
    join public.contracts c on c.id = d.contract_id
    where d.id = dispute_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "dispute_evidence_insert_party" on public.dispute_evidence;
create policy "dispute_evidence_insert_party"
on public.dispute_evidence for insert
with check (
  submitted_by = auth.uid()
  and exists (
    select 1
    from public.disputes d
    join public.contracts c on c.id = d.contract_id
    where d.id = dispute_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "audit_log_select_party" on public.audit_log;
create policy "audit_log_select_party"
on public.audit_log for select
using (
  contract_id is not null
  and exists (
    select 1
    from public.contracts c
    where c.id = contract_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);
