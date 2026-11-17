-- Public Click cards are read through a restricted RPC. Anonymous clients do
-- not get direct SELECT access to either table, and private notes are not stored here.
create table if not exists public.click_share_cards (
  share_token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  photo_url text,
  bio text not null default '',
  interests text[] not null default '{}',
  current_preset_id text not null,
  current_preset_name text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.click_share_card_socials (
  id bigint generated always as identity primary key,
  share_token text not null references public.click_share_cards(share_token) on delete cascade,
  preset_id text not null,
  platform_name text not null,
  handle text not null default '',
  action_label text not null default 'Open',
  open_type text not null default 'link'
    check (open_type in ('link', 'copy', 'lookup', 'link_or_copy')),
  profile_url text,
  copy_value text,
  copy_note text,
  sort_order integer not null default 0
);

alter table public.click_share_cards enable row level security;
alter table public.click_share_card_socials enable row level security;

revoke all on table public.click_share_cards from anon, authenticated;
revoke all on table public.click_share_card_socials from anon, authenticated;
grant select, insert, update, delete on table public.click_share_cards to authenticated;
grant select, insert, update, delete on table public.click_share_card_socials to authenticated;
grant usage, select on sequence public.click_share_card_socials_id_seq to authenticated;

drop policy if exists "Owners manage their Click share cards" on public.click_share_cards;
create policy "Owners manage their Click share cards"
  on public.click_share_cards
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Owners manage socials on their Click share cards" on public.click_share_card_socials;
create policy "Owners manage socials on their Click share cards"
  on public.click_share_card_socials
  for all to authenticated
  using (
    exists (
      select 1
      from public.click_share_cards as card
      where card.share_token = click_share_card_socials.share_token
        and card.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.click_share_cards as card
      where card.share_token = click_share_card_socials.share_token
        and card.user_id = (select auth.uid())
    )
  );

create or replace function public.get_public_click_card(p_share_token text)
returns table (
  display_name text,
  photo_url text,
  bio text,
  interests text[],
  current_preset_name text,
  socials jsonb
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    card.display_name,
    card.photo_url,
    card.bio,
    card.interests,
    card.current_preset_name,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'platform_name', social.platform_name,
            'handle', social.handle,
            'action_label', social.action_label,
            'open_type', social.open_type,
            'profile_url', social.profile_url,
            'copy_value', social.copy_value,
            'copy_note', social.copy_note
          ) order by social.sort_order, social.id
        )
        from public.click_share_card_socials as social
        where social.share_token = card.share_token
          and social.preset_id = card.current_preset_id
      ),
      '[]'::jsonb
    ) as socials
  from public.click_share_cards as card
  where card.share_token = p_share_token
    and card.revoked_at is null
  limit 1;
$$;

revoke all on function public.get_public_click_card(text) from public;
grant execute on function public.get_public_click_card(text) to anon, authenticated;
