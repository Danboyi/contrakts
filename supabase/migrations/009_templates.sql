create table if not exists contract_templates (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  industry text not null default 'other',
  currency text not null default 'USD',
  terms text,
  is_system boolean not null default false,
  is_public boolean not null default false,
  author_id uuid references users(id) on delete cascade,
  use_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists template_milestones (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references contract_templates(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text,
  amount_hint numeric,
  created_at timestamptz not null default now()
);

alter table contract_templates enable row level security;
alter table template_milestones enable row level security;

drop policy if exists "templates_select" on contract_templates;
create policy "templates_select"
on contract_templates for select
using (
  is_system = true or
  is_public = true or
  auth.uid() = author_id
);

drop policy if exists "templates_insert" on contract_templates;
create policy "templates_insert"
on contract_templates for insert
with check (auth.uid() = author_id);

drop policy if exists "templates_update_own" on contract_templates;
create policy "templates_update_own"
on contract_templates for update
using (auth.uid() = author_id and is_system = false);

drop policy if exists "templates_delete_own" on contract_templates;
create policy "templates_delete_own"
on contract_templates for delete
using (auth.uid() = author_id and is_system = false);

drop policy if exists "template_milestones_select" on template_milestones;
create policy "template_milestones_select"
on template_milestones for select
using (
  exists (
    select 1
    from contract_templates t
    where t.id = template_id
      and (
        t.is_system = true or
        t.is_public = true or
        t.author_id = auth.uid()
      )
  )
);

drop policy if exists "template_milestones_insert" on template_milestones;
create policy "template_milestones_insert"
on template_milestones for insert
with check (
  exists (
    select 1
    from contract_templates t
    where t.id = template_id
      and t.author_id = auth.uid()
  )
);

drop policy if exists "template_milestones_delete_own" on template_milestones;
create policy "template_milestones_delete_own"
on template_milestones for delete
using (
  exists (
    select 1
    from contract_templates t
    where t.id = template_id
      and t.author_id = auth.uid()
  )
);

create or replace function increment_template_use(template_id uuid)
returns void
language sql
security definer
as $$
  update contract_templates
  set use_count = use_count + 1
  where id = template_id;
$$;
