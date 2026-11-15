-- Clicks belong to the user who made them. Each user can only see and change their own.
-- snapshot holds what the other person shared through their preset at the moment of the click.
create table public.clicks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  other_user_id uuid references auth.users(id) on delete set null,
  snapshot jsonb not null,
  location text not null default '',
  event text not null default '',
  note text not null default '',
  clicked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index clicks_owner_id_clicked_at_idx on public.clicks (owner_id, clicked_at desc);
create index clicks_other_user_id_idx on public.clicks (other_user_id);

alter table public.clicks enable row level security;

create policy "Users can read their own clicks" on public.clicks
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create their own clicks" on public.clicks
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update their own clicks" on public.clicks
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own clicks" on public.clicks
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- Test data until the bracelet hardware exists. Gives the caller the prototype's demo clicks
-- if they have none yet. Runs as the caller, so the access rules above still apply.
create function public.seed_demo_clicks()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in before seeding demo clicks';
  end if;
  if exists (select 1 from public.clicks where owner_id = auth.uid()) then
    return 0;
  end if;
  insert into public.clicks (owner_id, snapshot, location, event, clicked_at) values
    (auth.uid(), '{"name":"Audrey Guinn Stephenson","desc":"Founder of Click · Electro-pop musician · Business, Cal Poly","about":"Founded Click. Electro-pop musician who writes, sings, and produces her own music. Startup founder, marketing, entrepreneur.","socials":[{"key":"ig","plat":"Instagram","handle":"@audreyguinn","action":"Follow"},{"key":"li","plat":"LinkedIn","handle":"Audrey Guinn Stephenson","action":"Connect"},{"key":"web","plat":"Click Website","handle":"clickbracelet.com","action":"Visit"}],"photoKey":"audrey"}'::jsonb, 'Cal Poly', 'AI Hackathon', now() - interval '5 minutes'),
    (auth.uid(), '{"name":"Chloe Malone","desc":"Liberal Studies, Cal Poly · Flag Football #4 · Loves reading","about":"Liberal Studies major on the flag football team who loves reading books.","socials":[{"key":"ig","plat":"Instagram","handle":"@chloeemalone","action":"Follow"},{"key":"tt","plat":"TikTok","handle":"@chloe.brynn","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"chloemalone4","action":"Add"}],"photoKey":"chloe"}'::jsonb, 'Doerr Family Field, Cal Poly', '', now() - interval '20 minutes'),
    (auth.uid(), '{"name":"Leila Butler","desc":"Landscape Architecture, Cal Poly · Flag Football #15 · Social Media Manager","about":"Surfs, draws, and runs the flag football team social media.","socials":[{"key":"ig","plat":"Instagram","handle":"@leilatani12","action":"Follow"},{"key":"tt","plat":"TikTok","handle":"@leilatani","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"leilabutler12","action":"Add"}],"photoKey":"leila"}'::jsonb, 'Doerr Family Field, Cal Poly', '', now() - interval '22 minutes'),
    (auth.uid(), '{"name":"Payton Stern","desc":"Interdisciplinary Studies, Cal Poly · Flag Football #3 · Outdoors","about":"Loves spending time outdoors and hiking.","socials":[{"key":"ig","plat":"Instagram","handle":"@payton.sternn","action":"Follow"},{"key":"tt","plat":"TikTok","handle":"@payton_stern","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"paytonsternn","action":"Add"}],"photoKey":"payton"}'::jsonb, 'Doerr Family Field, Cal Poly', '', now() - interval '24 minutes'),
    (auth.uid(), '{"name":"Sadie Roney","desc":"Wine & Viticulture, Cal Poly · Flag Football #5 · Beach & Travel","about":"Loves sports, the beach, and traveling.","socials":[{"key":"ig","plat":"Instagram","handle":"@sadie_roney","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"sadieroney","action":"Add"}],"photoKey":"sadie"}'::jsonb, 'Doerr Family Field, Cal Poly', '', now() - interval '26 minutes'),
    (auth.uid(), '{"name":"Lola Acosta","desc":"Liberal Studies, Cal Poly · Flag Football #22 · Surfer","about":"Loves playing sports, surfing, and any kind of exercise or workout.","socials":[{"key":"ig","plat":"Instagram","handle":"@lolabelle.22","action":"Follow"},{"key":"tt","plat":"TikTok","handle":"@lolasspamzz22","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"lola.belle22","action":"Add"}],"photoKey":"lola"}'::jsonb, 'Doerr Family Field, Cal Poly', '', now() - interval '28 minutes'),
    (auth.uid(), '{"name":"Priya Patel","desc":"Design major · Runner · Plant parent","about":"Graphic design, running, plants.","socials":[{"key":"ig","plat":"Instagram","handle":"@priya.designs","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"priyap","action":"Add"}],"age":19}'::jsonb, 'Cal Poly, San Luis Obispo', 'Startup Launch Weekend', now() - interval '300 minutes'),
    (auth.uid(), '{"name":"Marcus Lee","desc":"Film student · Surfer · Coffee snob","about":"Film, acting, surfing, coffee.","socials":[{"key":"li","plat":"LinkedIn","handle":"Marcus Lee","action":"Connect"},{"key":"web","plat":"Website","handle":"marcuslee.film","action":"Visit"}],"age":20}'::jsonb, 'Cal Poly, San Luis Obispo', 'Cal Poly Career Fair', now() - interval '1500 minutes'),
    (auth.uid(), '{"name":"Jordan Reyes","desc":"Electrical Engineering · Climber · DJ","about":"Electrical engineering, circuits, climbing, DJ music.","socials":[{"key":"ig","plat":"Instagram","handle":"@jordan.reyes","action":"Follow"},{"key":"sc","plat":"Snapchat","handle":"jreyes","action":"Add"}],"age":21}'::jsonb, 'Avila Beach', '', now() - interval '4400 minutes'),
    (auth.uid(), '{"name":"Sam Chen","desc":"Marketing · Foodie · Runner","about":"Marketing, food, running, entrepreneurship.","socials":[{"key":"li","plat":"LinkedIn","handle":"Sam Chen","action":"Connect"},{"key":"ig","plat":"Instagram","handle":"@samchen.eats","action":"Follow"}],"age":22}'::jsonb, 'San Luis Obispo', 'CPE Mixer', now() - interval '14000 minutes'),
    (auth.uid(), '{"name":"Taylor Brooks","desc":"Musician · Barista · Thrifter","about":"Singer songwriter, coffee, thrifting, books and poetry.","socials":[{"key":"ig","plat":"Instagram","handle":"@taylorbrooks","action":"Follow"},{"key":"sp","plat":"Spotify","handle":"Taylor Brooks","action":"Listen"}],"age":19}'::jsonb, 'Downtown San Luis Obispo', 'Open mic night', now() - interval '100000 minutes'),
    (auth.uid(), '{"name":"Lee Park","desc":"Architecture · Surfer · Photographer","about":"Architecture, surfing, photography.","socials":[{"key":"ig","plat":"Instagram","handle":"@leepark.photo","action":"Follow"},{"key":"web","plat":"Website","handle":"leepark.studio","action":"Visit"}],"age":23}'::jsonb, 'Pismo Beach', '', now() - interval '290000 minutes');
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke execute on function public.seed_demo_clicks() from public, anon;
grant execute on function public.seed_demo_clicks() to authenticated;
