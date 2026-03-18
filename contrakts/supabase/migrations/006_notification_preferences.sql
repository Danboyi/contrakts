create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  notification_type text not null,
  in_app boolean not null default true,
  email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, notification_type)
);

create index if not exists idx_notification_preferences_user
  on notification_preferences(user_id);

alter table notification_preferences enable row level security;

create or replace function set_notification_preferences_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at
  on notification_preferences;

create trigger trg_notification_preferences_updated_at
before update on notification_preferences
for each row execute function set_notification_preferences_updated_at();

create policy "notification_preferences_select_own"
on notification_preferences for select
using (auth.uid() = user_id);

create policy "notification_preferences_insert_own"
on notification_preferences for insert
with check (auth.uid() = user_id);

create policy "notification_preferences_update_own"
on notification_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
