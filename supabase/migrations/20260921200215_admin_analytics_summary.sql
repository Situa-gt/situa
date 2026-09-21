-- Additive only. Deploy before the admin application. Never applied by this task.
create index if not exists contact_leads_project_created_at_idx
  on public.contact_leads (project_id, created_at desc);

create index if not exists analytics_events_created_cover_idx
  on public.analytics_events (created_at) include (event_type, project_id, model_id);

-- Small partial index (~4k rows): lets the search/calculator filter groups be read
-- index-only, so the admin overview does not fetch wide heap pages for them.
create index if not exists analytics_events_search_filters_idx
  on public.analytics_events (created_at) include (event_type, filters)
  where event_type in ('search','calculator_submit');

alter table public.analytics_events set (
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_vacuum_insert_threshold = 5000
);

create or replace function public.admin_analytics_summary(
  p_from timestamptz, p_to timestamptz, p_developer_id uuid default null,
  p_include_suggestions boolean default false,
  p_include_searches boolean default false
) returns jsonb
language sql stable security invoker set search_path = ''
as $function$
with projects as materialized (
 select p.id,p.name,p.zone_id,p.is_active,
   jsonb_build_object('name',d.name) as developers,
   jsonb_build_object('name',z.name) as zones
 from public.projects p left join public.developers d on d.id=p.developer_id
 left join public.zones z on z.id=p.zone_id
 where p_developer_id is null or p.developer_id=p_developer_id
), scoped_events as (
 -- Separate branches let the planner use the project/date index for affiliates,
 -- instead of scanning the global date range and filtering with a subplan.
 select e.created_at,e.event_type,e.project_id,e.model_id
 from public.analytics_events e
 where p_developer_id is null and e.created_at >= p_from and e.created_at <= p_to
 and e.event_type in
   ('project_view','model_view','search','calculator_submit','contact_form_start','contact_form_submit')
 union all
 select e.created_at,e.event_type,e.project_id,e.model_id
 from projects p join public.analytics_events e on e.project_id=p.id
 where p_developer_id is not null and e.created_at >= p_from and e.created_at <= p_to
 -- Affiliate callers never include suggestion payloads, even if they pass true.
 and e.event_type in
   ('project_view','model_view','search','calculator_submit','contact_form_start','contact_form_submit')
), events as materialized (
 select e.event_type,e.project_id,e.model_id,
   (e.created_at at time zone 'America/Guatemala')::date as day
 from scoped_events e
), leads as materialized (
 select l.project_id,(l.created_at at time zone 'America/Guatemala')::date as day
 from public.contact_leads l
 where l.created_at >= p_from and l.created_at <= p_to
 and (p_developer_id is null or exists(select 1 from projects p where p.id=l.project_id))
), counted_events as (
 -- Independent, narrow projection: existing event/type/date indexes can cover
 -- totals without fetching JSON payloads, including suggestion totals.
 select e.event_type from public.analytics_events e
 where p_developer_id is null and e.created_at >= p_from and e.created_at <= p_to
 union all
 select e.event_type from projects p join public.analytics_events e on e.project_id=p.id
 where p_developer_id is not null and e.created_at >= p_from and e.created_at <= p_to
), event_counts as (
 select event_type::text as id,count(*) as count from counted_events group by event_type
), project_counts as (
 select project_id as id,
 count(*) filter(where event_type='project_view') as project_views,
 count(*) filter(where event_type='model_view') as model_views,
 count(*) filter(where event_type='contact_form_start') as contact_starts,
 count(*) filter(where event_type='contact_form_submit') as contact_submits
 from events where project_id is not null group by project_id
), lead_counts as (
 select project_id as id,count(*) as count from leads group by project_id
), model_counts as (
 select model_id as id,count(*) as count from events
 where event_type='model_view' and model_id is not null group by model_id
), daily_events as (
 select day,count(*) filter(where event_type='project_view') as pv,
 count(*) filter(where event_type='model_view') as mv,
 count(*) filter(where p_developer_id is null and event_type in ('search','calculator_submit')) as searches
 from events group by day
), daily_leads as (select day,count(*) as count from leads group by day),
 trend as (
 select to_char(d.day,'YYYY-MM-DD') as date,coalesce(e.pv,0) as "projectViews",
 coalesce(e.mv,0) as "modelViews",coalesce(l.count,0) as leads,
 coalesce(e.searches,0) as searches
 from generate_series((p_from at time zone 'America/Guatemala')::date::timestamp,
 (p_to at time zone 'America/Guatemala')::date::timestamp,interval '1 day') d(day)
 left join daily_events e on e.day=d.day left join daily_leads l on l.day=d.day
 order by d.day
), search_events as (
 select e.event_type,e.filters from public.analytics_events e
 where p_developer_id is null and p_include_searches
 and e.created_at >= p_from and e.created_at <= p_to
 and e.event_type in ('search','calculator_submit')
), search_groups as (
 -- Aggregate complete filter buckets, never sampled events. Presentation merges
 -- equivalent display labels before its explicit top-8 ranking.
 select event_type::text as event_type,coalesce(filters,'{}'::jsonb) as filters,count(*) as count
 from search_events
 group by event_type,filters
), zone_activity as (
 select p.zone_id as id,count(*) as count from events e join projects p on p.id=e.project_id
 where e.event_type in ('project_view','model_view') and p.zone_id is not null group by p.zone_id
), lead_zones as (
 select p.zone_id as id,count(*) as count from leads l join projects p on p.id=l.project_id
 where p.zone_id is not null group by p.zone_id
), suggestions as (
 select e.project_id as source_id,btrim(e.filters->>'suggested_project_id') as target_id,
 count(*) filter(where event_type='suggested_project_impression') as impressions,
 count(*) filter(where event_type='suggested_project_click') as clicks
 from public.analytics_events e where p_developer_id is null and p_include_suggestions
 and e.created_at >= p_from and e.created_at <= p_to
 and event_type in ('suggested_project_impression','suggested_project_click')
 group by e.project_id,btrim(e.filters->>'suggested_project_id')
)
select jsonb_build_object(
 'eventCounts',coalesce((select jsonb_object_agg(id,count) from event_counts),'{}'::jsonb),
 'leadTotal',(select count(*) from leads),
 'projects',coalesce((select jsonb_agg(to_jsonb(p)) from projects p),'[]'::jsonb),
 'models',coalesce((select jsonb_agg(to_jsonb(m)) from (
   select m.id,m.project_id,m.name from public.models m join projects p on p.id=m.project_id
 ) m),'[]'::jsonb),
 'projectCounts',coalesce((select jsonb_agg(to_jsonb(c)) from project_counts c),'[]'::jsonb),
 'modelCounts',coalesce((select jsonb_object_agg(id,count) from model_counts),'{}'::jsonb),
 'leadCounts',coalesce((select jsonb_object_agg(id,count) from lead_counts where id is not null),'{}'::jsonb),
 'leadZoneCounts',coalesce((select jsonb_object_agg(id,count) from lead_zones),'{}'::jsonb),
 'zoneActivity',coalesce((select jsonb_object_agg(id,count) from zone_activity),'{}'::jsonb),
 'trend',coalesce((select jsonb_agg(case when p_developer_id is null then to_jsonb(t) else to_jsonb(t)-'searches' end) from trend t),'[]'::jsonb)
) || case when p_developer_id is null then jsonb_build_object(
 'zones',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'url_slug',url_slug)) from public.zones),'[]'::jsonb),
 'searchGroups',coalesce((select jsonb_agg(to_jsonb(s)) from search_groups s),'[]'::jsonb)
) || case when p_include_suggestions then jsonb_build_object(
 'suggestions',coalesce((select jsonb_agg(to_jsonb(s)) from suggestions s),'[]'::jsonb)
) else '{}'::jsonb end
else jsonb_build_object('zones',coalesce((select jsonb_agg(jsonb_build_object('id',z.id,'name',z.name,'url_slug',z.url_slug)) from public.zones z where exists(select 1 from projects p where p.zone_id=z.id)),'[]'::jsonb)) end;
$function$;

revoke all on function public.admin_analytics_summary(timestamptz,timestamptz,uuid,boolean,boolean) from public, anon, authenticated;
grant execute on function public.admin_analytics_summary(timestamptz,timestamptz,uuid,boolean,boolean) to service_role;
