-- Guest mode: someone who taps a Click bracelet with their phone, without the app or an
-- account, sees that person's card. This is the one thing a signed-out phone may read,
-- and only with a valid share code. It returns the same public card a click saves
-- (name, interests, bio, photo, socials, custom links) and never the email, notes,
-- presets or anyone's clicks. Codes are 10 random characters, so they can't be guessed.
create or replace function public.get_public_card(code text)
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

-- Guest mode also shows a few featured cards beside the sharer's. Today that is Sabine
-- Chung's card exactly as it is saved in Audrey's clicks (photo, socials and all), so no
-- extra share link is needed. Only the public card snapshot is returned: no notes,
-- locations or anything else from Audrey's account.
create or replace function public.get_guest_featured_cards()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(c.snapshot order by c.clicked_at desc), '[]'::jsonb)
  from (
    select distinct on (c.person_name) c.snapshot, c.clicked_at
    from public.clicks c
    join public.profiles p on p.id = c.owner_id
    where p.display_name = 'Audrey Guinn Stephenson'
      and c.person_name in ('Sabine Chung')
    order by c.person_name, c.clicked_at desc
  ) c;
$$;

revoke all on function public.get_guest_featured_cards() from public;
grant execute on function public.get_guest_featured_cards() to anon, authenticated;
