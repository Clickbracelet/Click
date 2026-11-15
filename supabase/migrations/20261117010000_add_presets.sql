-- Presets decide which socials a click receives. The page's Presets tab saves them here,
-- and share_snapshot only includes the accounts in the active preset, so a handle that
-- isn't shared never leaves the database. Clicks keep the socials they were given: a
-- later preset change only reaches someone when they open the share link again.
-- The defaults match the page's built-in presets.
alter table public.profiles
  add column presets jsonb not null default '[{"id":"party","name":"Party","plats":["ig","sc"],"custom":false},{"id":"network","name":"Networking","plats":["li","web"],"custom":false},{"id":"everyday","name":"Everyday","plats":["ig","tt"],"custom":false}]'::jsonb
    check (jsonb_typeof(presets) = 'array'),
  add column active_preset text not null default 'party';

grant insert (presets, active_preset) on public.profiles to authenticated;
grant update (presets, active_preset) on public.profiles to authenticated;

create or replace function public.share_snapshot(p public.profiles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with active as (
    -- The active preset's accounts, or the first preset's if the active one is gone.
    select coalesce(
      (select e->'plats' from jsonb_array_elements(p.presets) e where e->>'id' = p.active_preset limit 1),
      p.presets->0->'plats'
    ) as plats
  ), shared as (
    select array(
      select jsonb_array_elements_text(case when jsonb_typeof(a.plats) = 'array' then a.plats else '[]'::jsonb end)
    ) as ids
    from active a
  )
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
      ) as plat(ord, key, name, action), shared s
      where btrim(coalesce(p.socials->>plat.key, '')) <> '' and plat.key = any(s.ids)
    ), '[]'::jsonb) || coalesce((
      select jsonb_agg(jsonb_build_object('key', 'other', 'plat', link->>'name', 'handle', link->>'handle', 'action', 'Visit'))
      from jsonb_array_elements(p.custom_links) link, shared s
      where btrim(coalesce(link->>'name', '')) <> '' and btrim(coalesce(link->>'handle', '')) <> ''
        and (link->>'on') is distinct from 'false' and link->>'id' = any(s.ids)
    ), '[]'::jsonb)
  ));
$$;

revoke execute on function public.share_snapshot(public.profiles) from public, anon, authenticated;
