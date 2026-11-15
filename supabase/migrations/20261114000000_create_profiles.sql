-- Applied to the Click Supabase project. Each user can only read and write their own profile and avatar.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  interests text[] not null default '{}',
  photo_url text,
  socials jsonb not null default '{}'::jsonb,
  custom_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Users can read their own avatar files" on storage.objects
  for select to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can upload their own avatar" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can replace their own avatar" on storage.objects
  for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
