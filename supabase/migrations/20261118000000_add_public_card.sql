-- Guest mode: someone who taps a Click bracelet with their phone, without the app or an
-- account, sees that person's card. This is the one thing a signed-out phone may read,
-- and only with a valid share code. It returns the same public card a click saves
-- (name, interests, bio, photo, socials, custom links) and never the email, notes,
-- presets or anyone's clicks. Codes are 10 random characters, so they can't be guessed.
create function public.get_public_card(code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.share_snapshot(p)
  from public.profiles p
  where p.share_code = code;
$$;

revoke all on function public.get_public_card(text) from public;
grant execute on function public.get_public_card(text) to anon, authenticated;
