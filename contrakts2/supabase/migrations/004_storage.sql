insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deliverables',
  'deliverables',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'audio/mpeg',
    'text/plain'
  ]
)
on conflict (id) do nothing;

drop policy if exists "deliverables_select_party" on public.deliverables;
create policy "deliverables_select_party"
on public.deliverables for select
using (
  exists (
    select 1
    from public.milestones m
    join public.contracts c on c.id = m.contract_id
    where m.id = milestone_id
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "deliverables_insert_vendor" on public.deliverables;
create policy "deliverables_insert_vendor"
on public.deliverables for insert
with check (
  submitted_by = auth.uid()
  and exists (
    select 1
    from public.milestones m
    join public.contracts c on c.id = m.contract_id
    where m.id = milestone_id
      and c.counterparty_id = auth.uid()
  )
);

drop policy if exists "deliverables_delete_submitter" on public.deliverables;
create policy "deliverables_delete_submitter"
on public.deliverables for delete
using (
  submitted_by = auth.uid()
);

drop policy if exists "deliverables_upload_party" on storage.objects;
create policy "deliverables_upload_party"
on storage.objects for insert
with check (
  bucket_id = 'deliverables'
  and auth.uid() is not null
  and exists (
    select 1
    from public.milestones m
    join public.contracts c on c.id = m.contract_id
    where c.id::text = split_part(name, '/', 1)
      and m.id::text = split_part(name, '/', 2)
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "deliverables_read_party" on storage.objects;
create policy "deliverables_read_party"
on storage.objects for select
using (
  bucket_id = 'deliverables'
  and auth.uid() is not null
  and exists (
    select 1
    from public.milestones m
    join public.contracts c on c.id = m.contract_id
    where c.id::text = split_part(name, '/', 1)
      and m.id::text = split_part(name, '/', 2)
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);

drop policy if exists "deliverables_delete_own" on storage.objects;
create policy "deliverables_delete_own"
on storage.objects for delete
using (
  bucket_id = 'deliverables'
  and owner = auth.uid()
  and exists (
    select 1
    from public.milestones m
    join public.contracts c on c.id = m.contract_id
    where c.id::text = split_part(name, '/', 1)
      and m.id::text = split_part(name, '/', 2)
      and (c.initiator_id = auth.uid() or c.counterparty_id = auth.uid())
  )
);
