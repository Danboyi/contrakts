-- ════════════════════════════════════════════════
-- 013 — Messages, Submission Flow, Version Tracking
-- ════════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- TABLE 1: messages
-- ────────────────────────────────────────────────
create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  contract_id       uuid not null
                      references public.contracts(id) on delete cascade,
  sender_id         uuid not null
                      references public.users(id),
  body              text not null,
  attachment_url    text,
  attachment_name   text,
  attachment_type   text,
  attachment_size   bigint,
  message_type      text not null default 'user'
                      check (message_type in (
                        'user',
                        'system',
                        'file',
                        'submission',
                        'feedback'
                      )),
  milestone_id      uuid references public.milestones(id) on delete set null,
  deliverable_id    uuid references public.deliverables(id) on delete set null,
  read_by_recipient boolean not null default false,
  read_at           timestamptz,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists idx_messages_contract
  on public.messages(contract_id, created_at desc);
create index if not exists idx_messages_sender
  on public.messages(sender_id);
create index if not exists idx_messages_milestone
  on public.messages(milestone_id)
  where milestone_id is not null;
create index if not exists idx_messages_deliverable
  on public.messages(deliverable_id)
  where deliverable_id is not null;
create index if not exists idx_messages_unread
  on public.messages(contract_id, created_at desc)
  where read_by_recipient = false and deleted_at is null;

-- ────────────────────────────────────────────────
-- TABLE 2: submissions
-- ────────────────────────────────────────────────
create table if not exists public.submissions (
  id                uuid primary key default gen_random_uuid(),
  contract_id       uuid not null
                      references public.contracts(id) on delete cascade,
  milestone_id      uuid not null
                      references public.milestones(id) on delete cascade,
  submitted_by      uuid not null
                      references public.users(id),
  version           integer not null default 1,
  state             text not null default 'pending_review'
                      check (state in (
                        'pending_review',
                        'in_review',
                        'approved',
                        'revision_requested',
                        'rejected'
                      )),
  note              text,
  submission_type   text not null default 'files'
                      check (submission_type in (
                        'files',
                        'link',
                        'code',
                        'mixed'
                      )),
  external_url      text,
  submitted_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),

  constraint submissions_milestone_version_key
    unique (milestone_id, version)
);

create index if not exists idx_submissions_milestone
  on public.submissions(milestone_id, version desc);
create index if not exists idx_submissions_contract
  on public.submissions(contract_id);
create index if not exists idx_submissions_submitter
  on public.submissions(submitted_by);
create index if not exists idx_submissions_state
  on public.submissions(state)
  where state = 'pending_review';

-- ────────────────────────────────────────────────
-- TABLE 3: submission_reviews
-- ────────────────────────────────────────────────
create table if not exists public.submission_reviews (
  id                uuid primary key default gen_random_uuid(),
  submission_id     uuid not null
                      references public.submissions(id) on delete cascade,
  reviewer_id       uuid not null
                      references public.users(id),
  verdict           text not null
                      check (verdict in (
                        'approved',
                        'revision_requested',
                        'rejected'
                      )),
  feedback          text,
  feedback_items    jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),

  constraint submission_reviews_submission_id_key
    unique (submission_id)
);

create index if not exists idx_submission_reviews_submission
  on public.submission_reviews(submission_id);
create index if not exists idx_submission_reviews_reviewer
  on public.submission_reviews(reviewer_id);

-- ────────────────────────────────────────────────
-- EXTEND: deliverables table
-- ────────────────────────────────────────────────
alter table public.deliverables
  add column if not exists submission_id uuid
    references public.submissions(id) on delete set null;

alter table public.deliverables
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_deliverables_submission
  on public.deliverables(submission_id);

-- ────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────
alter table public.messages enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_reviews enable row level security;

drop policy if exists "Contract parties can view messages" on public.messages;
create policy "Contract parties can view messages"
  on public.messages for select
  to authenticated
  using (
    deleted_at is null
    and contract_id in (
      select id
      from public.contracts
      where initiator_id = auth.uid()
         or counterparty_id = auth.uid()
         or service_provider_id = auth.uid()
         or service_receiver_id = auth.uid()
    )
  );

drop policy if exists "Contract parties can send messages" on public.messages;
create policy "Contract parties can send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and contract_id in (
      select id
      from public.contracts
      where initiator_id = auth.uid()
         or counterparty_id = auth.uid()
         or service_provider_id = auth.uid()
         or service_receiver_id = auth.uid()
    )
  );

drop policy if exists "Sender can soft-delete own messages" on public.messages;
create policy "Sender can soft-delete own messages"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "Contract parties can view submissions" on public.submissions;
create policy "Contract parties can view submissions"
  on public.submissions for select
  to authenticated
  using (
    contract_id in (
      select id
      from public.contracts
      where initiator_id = auth.uid()
         or counterparty_id = auth.uid()
         or service_provider_id = auth.uid()
         or service_receiver_id = auth.uid()
    )
  );

drop policy if exists "Service provider can create submissions" on public.submissions;
create policy "Service provider can create submissions"
  on public.submissions for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and contract_id in (
      select id
      from public.contracts
      where service_provider_id = auth.uid()
    )
  );

drop policy if exists "Submission state can be updated by parties" on public.submissions;
create policy "Submission state can be updated by parties"
  on public.submissions for update
  to authenticated
  using (
    contract_id in (
      select id
      from public.contracts
      where initiator_id = auth.uid()
         or counterparty_id = auth.uid()
         or service_provider_id = auth.uid()
         or service_receiver_id = auth.uid()
    )
  )
  with check (
    contract_id in (
      select id
      from public.contracts
      where initiator_id = auth.uid()
         or counterparty_id = auth.uid()
         or service_provider_id = auth.uid()
         or service_receiver_id = auth.uid()
    )
  );

drop policy if exists "Contract parties can view reviews" on public.submission_reviews;
create policy "Contract parties can view reviews"
  on public.submission_reviews for select
  to authenticated
  using (
    submission_id in (
      select s.id
      from public.submissions s
      join public.contracts c on c.id = s.contract_id
      where c.initiator_id = auth.uid()
         or c.counterparty_id = auth.uid()
         or c.service_provider_id = auth.uid()
         or c.service_receiver_id = auth.uid()
    )
  );

drop policy if exists "Service receiver can create reviews" on public.submission_reviews;
create policy "Service receiver can create reviews"
  on public.submission_reviews for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and submission_id in (
      select s.id
      from public.submissions s
      join public.contracts c on c.id = s.contract_id
      where c.service_receiver_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────
-- GRANTS
-- ────────────────────────────────────────────────
grant all on public.messages to authenticated;
grant all on public.submissions to authenticated;
grant all on public.submission_reviews to authenticated;

-- ────────────────────────────────────────────────
-- ENABLE REALTIME
-- ────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end $$;

-- ────────────────────────────────────────────────
-- STORAGE: attachments bucket for chat files
-- ────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_upload_party" on storage.objects;
create policy "attachments_upload_party"
on storage.objects for insert
with check (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and exists (
    select 1
    from public.contracts c
    where c.id::text = split_part(name, '/', 1)
      and (
        c.initiator_id = auth.uid()
        or c.counterparty_id = auth.uid()
        or c.service_provider_id = auth.uid()
        or c.service_receiver_id = auth.uid()
      )
  )
);

drop policy if exists "attachments_read_party" on storage.objects;
create policy "attachments_read_party"
on storage.objects for select
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and exists (
    select 1
    from public.contracts c
    where c.id::text = split_part(name, '/', 1)
      and (
        c.initiator_id = auth.uid()
        or c.counterparty_id = auth.uid()
        or c.service_provider_id = auth.uid()
        or c.service_receiver_id = auth.uid()
      )
  )
);

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own"
on storage.objects for delete
using (
  bucket_id = 'attachments'
  and owner = auth.uid()
  and exists (
    select 1
    from public.contracts c
    where c.id::text = split_part(name, '/', 1)
      and (
        c.initiator_id = auth.uid()
        or c.counterparty_id = auth.uid()
        or c.service_provider_id = auth.uid()
        or c.service_receiver_id = auth.uid()
      )
  )
);
