-- The app saves profiles with an upsert, which also writes id on conflict. The update
-- policy's check (auth.uid() = id) still stops anyone changing it to another user's id.
grant update (id) on public.profiles to authenticated;
