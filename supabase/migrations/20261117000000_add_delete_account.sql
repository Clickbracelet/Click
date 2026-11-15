-- Delete account: removes everything stored about the signed-in user. Their own clicks,
-- every other account's click of them (snapshots hold their name, photo and socials),
-- their profile, and their auth user (with its identities and sessions).
-- The avatar file is removed by the app through the Storage API first, because Storage
-- doesn't allow deleting files with SQL; the policy below lets a user delete their own.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Sign in before deleting your account';
  end if;
  delete from public.clicks where owner_id = uid or other_user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

create policy "Users can delete their own avatar" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
