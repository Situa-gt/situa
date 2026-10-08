-- Premium home spaces: add a daily trend to admin_home_slots_summary.
-- ADDITIVE: the result gains a 'trend' key; callers that ignore it keep working.
-- Days are bucketed in America/Guatemala, like admin_analytics_summary.

create or replace function public.admin_home_slots_summary(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql stable security invoker set search_path = ''
as $function$
with ev as (
  select e.event_type::text as kind, e.filters->>'slot' as slot, e.session_id,
         coalesce(e.project_id, nullif(e.filters->>'project_id','')::uuid) as project_id,
         nullif(e.filters->>'model_id','')::uuid as model_id,
         (e.created_at at time zone 'America/Guatemala')::date as day
  from public.analytics_events e
  where e.created_at >= p_from and e.created_at <= p_to
    and e.event_type::text in ('home_slot_impression','home_slot_click')
    and e.filters ? 'slot'
), by_slot as (
  select slot,
         count(*) filter (where kind='home_slot_impression') as impressions,
         count(*) filter (where kind='home_slot_click') as clicks,
         count(distinct session_id) filter (where kind='home_slot_impression') as sessions
  from ev group by slot
), by_item as (
  select ev.slot, ev.project_id, ev.model_id,
         count(*) filter (where kind='home_slot_impression') as impressions,
         count(*) filter (where kind='home_slot_click') as clicks
  from ev group by ev.slot, ev.project_id, ev.model_id
), by_day as (
  select day, slot,
         count(*) filter (where kind='home_slot_impression') as impressions,
         count(*) filter (where kind='home_slot_click') as clicks
  from ev group by day, slot
)
select jsonb_build_object(
  'slots', coalesce((select jsonb_agg(to_jsonb(s) order by s.slot) from by_slot s), '[]'::jsonb),
  'items', coalesce((select jsonb_agg(jsonb_build_object(
      'slot', i.slot, 'project_id', coalesce(i.project_id, m.project_id), 'model_id', i.model_id,
      'project_name', p.name, 'model_name', m.name,
      'impressions', i.impressions, 'clicks', i.clicks)
      order by i.slot, i.clicks desc, i.impressions desc)
    from by_item i
    left join public.models m on m.id = i.model_id
    left join public.projects p on p.id = coalesce(i.project_id, m.project_id)), '[]'::jsonb),
  'trend', coalesce((select jsonb_agg(jsonb_build_object(
      'day', d.day, 'slot', d.slot, 'impressions', d.impressions, 'clicks', d.clicks)
      order by d.day, d.slot) from by_day d), '[]'::jsonb)
);
$function$;

revoke all on function public.admin_home_slots_summary(timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.admin_home_slots_summary(timestamptz,timestamptz) to service_role;
