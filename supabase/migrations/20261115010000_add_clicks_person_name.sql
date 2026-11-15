-- Show the other person's name as its own column. It is generated from snapshot,
-- so it always matches what they shared and nothing has to write it separately.
alter table public.clicks
  add column person_name text generated always as (snapshot->>'name') stored;
