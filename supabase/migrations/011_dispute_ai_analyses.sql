create table if not exists dispute_ai_analyses (
  id uuid primary key default uuid_generate_v4(),
  dispute_id uuid not null unique references disputes(id) on delete cascade,
  recommended_ruling text not null,
  vendor_pct int,
  confidence int not null,
  reasoning text not null,
  key_factors text[] not null default '{}',
  evidence_summary jsonb,
  contract_compliance jsonb,
  auto_resolvable boolean not null default false,
  appeal_risk text not null default 'medium',
  applied boolean not null default false,
  applied_by uuid references users(id),
  applied_at timestamptz,
  overridden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table dispute_ai_analyses enable row level security;

drop policy if exists ai_analyses_service_only on dispute_ai_analyses;
create policy ai_analyses_service_only
on dispute_ai_analyses for all
using (false);

create index if not exists idx_dispute_ai_dispute
on dispute_ai_analyses(dispute_id);
