-- Removes Audrey Guinn Stephenson from the demo clicks: from the seed function, and from
-- the demo clicks already given to accounts. Only demo rows (no other_user_id) are deleted,
-- so a real click with someone of that name is kept.
delete from public.clicks
where other_user_id is null and snapshot->>'name' = 'Audrey Guinn Stephenson';

create or replace function public.seed_demo_clicks()
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
