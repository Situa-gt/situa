-- First named (non-numbered) zone: "Carretera a El Salvador" (client decision 09-11-2026).
-- People know the corridor better than its municipalities (Santa Catarina Pinula, Fraijanes...),
-- so it hangs from the same municipality as the city zones and the project address names the real one.
-- It shows on the site only once it has an active project (the inventory decides).

insert into public.zones (municipality_id, name, slug, url_slug, is_canonical_for_slug, display_order, is_active)
select z.municipality_id, 'Carretera a El Salvador', 'carretera-a-el-salvador', 'carretera-a-el-salvador', true, 100, true
from public.zones z
where z.url_slug = 'zona-10'
  and not exists (select 1 from public.zones where url_slug = 'carretera-a-el-salvador');
