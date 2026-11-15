-- Share my Click (SHAREPLAN.md Phase 1): a user shares a link holding a random share code,
-- and whoever opens it can add them as a click. Profiles stay private: the functions below
-- are the only way to read someone else's profile, and only with their share code.

alter table public.profiles add column share_code text unique;

-- Only the functions below may set share codes, so nobody can pick a guessable one.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, display_name, bio, interests, photo_url, socials, custom_links, updated_at)
  on public.profiles to authenticated;
grant update (display_name, bio, interests, photo_url, socials, custom_links, updated_at)
  on public.profiles to authenticated;

-- Opening the same share link twice updates one click instead of adding another.
create unique index clicks_owner_id_other_user_id_key on public.clicks (owner_id, other_user_id)
  where other_user_id is not null;

-- 10 random characters from 0-9, A-Z and a-z.
create function public.new_share_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', get_byte(b.bytes, i) % 62 + 1, 1), '' order by i)
  from (select extensions.gen_random_bytes(10) as bytes) b, generate_series(0, 9) i;
$$;

-- What a click shows about a person, built from their profile in the same shape as
-- the demo clicks. Never includes their email.
create function public.share_snapshot(p public.profiles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'name', p.display_name,
    'desc', (select string_agg(t, ' · ') from unnest(p.interests) t where btrim(t) <> ''),
    'about', nullif(p.bio, ''),
    'photo', p.photo_url,
    'socials', coalesce((
      select jsonb_agg(jsonb_build_object('key', plat.key, 'plat', plat.name, 'handle', p.socials->>plat.key, 'action', plat.action) order by plat.ord)
      from (values
        (1, 'ig', 'Instagram', 'Follow'), (2, 'tt', 'TikTok', 'Follow'), (3, 'sc', 'Snapchat', 'Add'),
        (4, 'li', 'LinkedIn', 'Connect'), (5, 'x', 'X', 'Follow'), (6, 'fb', 'Facebook', 'Add'),
        (7, 'yt', 'YouTube', 'Subscribe'), (8, 'th', 'Threads', 'Follow'), (9, 'pin', 'Pinterest', 'Follow'),
        (10, 'sp', 'Spotify', 'Listen'), (11, 'dc', 'Discord', 'Add'), (12, 'br', 'BeReal', 'Add'),
        (13, 'web', 'Website', 'Visit')
      ) as plat(ord, key, name, action)
      where btrim(coalesce(p.socials->>plat.key, '')) <> ''
    ), '[]'::jsonb) || coalesce((
      select jsonb_agg(jsonb_build_object('key', 'other', 'plat', link->>'name', 'handle', link->>'handle', 'action', 'Visit'))
      from jsonb_array_elements(p.custom_links) link
      where btrim(coalesce(link->>'name', '')) <> '' and btrim(coalesce(link->>'handle', '')) <> ''
    ), '[]'::jsonb)
  ));
$$;

-- The caller's share code, made the first time they share.
create function public.get_my_share_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before sharing your Click';
  end if;
  insert into public.profiles (id) values (auth.uid()) on conflict (id) do nothing;
  select share_code into code from public.profiles where id = auth.uid();
  if code is null then
    update public.profiles set share_code = public.new_share_code() where id = auth.uid()
      returning share_code into code;
  end if;
  return code;
end;
$$;

-- Gives the caller a new share code, so links with the old one stop working.
create function public.reset_share_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before resetting your share link';
  end if;
  insert into public.profiles (id) values (auth.uid()) on conflict (id) do nothing;
  update public.profiles set share_code = public.new_share_code() where id = auth.uid()
    returning share_code into code;
  return code;
end;
$$;

-- Just enough for an "Add this person?" card. No rows if the code is unknown.
create function public.get_share_preview(code text)
returns table (name text, photo_url text, description text, is_self boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to add someone';
  end if;
  return query
    select p.display_name, p.photo_url, public.share_snapshot(p)->>'desc', p.id = auth.uid()
    from public.profiles p
    where p.share_code = code;
end;
$$;

-- Adds the owner of a share code to the caller's clicks, or refreshes the click if
-- they're already there. Returns the click's id.
create function public.add_click_from_share(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  sharer public.profiles;
  click_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to add someone';
  end if;
  select * into sharer from public.profiles where share_code = code;
  if not found then
    raise exception 'That share link is no longer valid';
  end if;
  if sharer.id = auth.uid() then
    raise exception 'That is your own share link';
  end if;
  insert into public.clicks (owner_id, other_user_id, snapshot)
    values (auth.uid(), sharer.id, public.share_snapshot(sharer))
    on conflict (owner_id, other_user_id) where other_user_id is not null
    do update set snapshot = excluded.snapshot, clicked_at = now()
    returning id into click_id;
  return click_id;
end;
$$;

revoke execute on function public.new_share_code() from public, anon, authenticated;
revoke execute on function public.share_snapshot(public.profiles) from public, anon, authenticated;
revoke execute on function public.get_my_share_code() from public, anon;
revoke execute on function public.reset_share_code() from public, anon;
revoke execute on function public.get_share_preview(text) from public, anon;
revoke execute on function public.add_click_from_share(text) from public, anon;
grant execute on function public.get_my_share_code() to authenticated;
grant execute on function public.reset_share_code() to authenticated;
grant execute on function public.get_share_preview(text) to authenticated;
grant execute on function public.add_click_from_share(text) to authenticated;
