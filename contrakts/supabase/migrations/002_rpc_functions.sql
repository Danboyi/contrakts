create or replace function increment_user_contracts(user_id uuid)
returns void language sql security definer as $$
  update users
  set total_contracts = total_contracts + 1
  where id = user_id;
$$;

create or replace function increment_user_completed(user_id uuid)
returns void language sql security definer as $$
  update users
  set completed_count = completed_count + 1
  where id = user_id;
$$;

create or replace function update_trust_score(
  user_id uuid,
  direction text
)
returns void language sql security definer as $$
  update users
  set trust_score = case
    when direction = 'up' then least(trust_score + 2, 100)
    when direction = 'down' then greatest(trust_score - 10, 0)
    else trust_score
  end
  where id = user_id;
$$;
