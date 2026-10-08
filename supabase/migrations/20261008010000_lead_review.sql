-- Lead review for Sitúa admins: "Verificado" and a person-level blocklist (phone and email).
-- ADDITIVE: new columns, table, trigger and RPC. admin_analytics_summary only gains
-- "l.blocked_at is null", which matches every lead until someone blocks one.

-- Comparable keys: the last 8 digits of the phone (Guatemala numbers, with or without +502)
-- and the trimmed, lowercased email.
create or replace function public.lead_phone_key(p_phone text)
returns text language sql immutable set search_path = ''
as $$
  select case when length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 8
              then right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 8) end
$$;

create or replace function public.lead_email_key(p_email text)
returns text language sql immutable set search_path = ''
as $$
  select nullif(lower(btrim(coalesce(p_email, ''))), '')
$$;

alter table public.contact_leads
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid,
  add column if not exists blocked_at timestamptz,
  add column if not exists phone_key text generated always as (public.lead_phone_key(phone)) stored,
  add column if not exists email_key text generated always as (public.lead_email_key(email)) stored;

create index if not exists contact_leads_phone_key_idx on public.contact_leads (phone_key);
create index if not exists contact_leads_email_key_idx on public.contact_leads (email_key);

-- One row per blocked phone or email. Service role only.
create table if not exists public.lead_blocklist (
  kind text not null check (kind in ('phone', 'email')),
  value text not null,
  lead_id uuid references public.contact_leads (id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  primary key (kind, value)
);
alter table public.lead_blocklist enable row level security;
revoke all on public.lead_blocklist from anon, authenticated;

-- New leads from a blocked person go straight to "Bloqueados". Generated columns are not
-- computed yet in a BEFORE trigger, so the keys are derived from NEW here.
create or replace function public.mark_blocked_lead()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if exists (
    select 1 from public.lead_blocklist b
    where (b.kind = 'phone' and b.value = public.lead_phone_key(new.phone))
       or (b.kind = 'email' and b.value = public.lead_email_key(new.email))
  ) then
    new.blocked_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists contact_leads_mark_blocked on public.contact_leads;
create trigger contact_leads_mark_blocked
  before insert on public.contact_leads
  for each row execute function public.mark_blocked_lead();

-- Block or unblock the person behind a lead: their phone and email, and every lead that shares them.
-- Unblocking keeps leads blocked when they still match another blocklist entry.
create or replace function public.admin_set_lead_blocked(p_lead_id uuid, p_blocked boolean, p_actor uuid)
returns integer language plpgsql security invoker set search_path = ''
as $$
declare
  v_phone text;
  v_email text;
  v_count integer;
begin
  select l.phone_key, l.email_key into v_phone, v_email from public.contact_leads l where l.id = p_lead_id;
  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  if p_blocked then
    insert into public.lead_blocklist (kind, value, lead_id, created_by)
    select t.kind, t.value, p_lead_id, p_actor
    from (values ('phone', v_phone), ('email', v_email)) as t (kind, value)
    where t.value is not null
    on conflict (kind, value) do nothing;

    update public.contact_leads l set blocked_at = now()
    where l.blocked_at is null
      and (l.id = p_lead_id
           or (v_phone is not null and l.phone_key = v_phone)
           or (v_email is not null and l.email_key = v_email));
  else
    delete from public.lead_blocklist b
    where (b.kind = 'phone' and b.value = v_phone) or (b.kind = 'email' and b.value = v_email);

    update public.contact_leads l set blocked_at = null
    where l.blocked_at is not null
      and (l.id = p_lead_id
           or (v_phone is not null and l.phone_key = v_phone)
           or (v_email is not null and l.email_key = v_email))
      and not exists (
        select 1 from public.lead_blocklist b
        where (b.kind = 'phone' and b.value = l.phone_key) or (b.kind = 'email' and b.value = l.email_key)
      );
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.admin_set_lead_blocked(uuid, boolean, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_lead_blocked(uuid, boolean, uuid) to service_role;

-- Analytics: blocked leads do not count. Same body as before plus "l.blocked_at is null".
CREATE OR REPLACE FUNCTION public.admin_analytics_summary(p_from timestamp with time zone, p_to timestamp with time zone, p_developer_id uuid, p_include_suggestions boolean, p_include_searches boolean, p_unit_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
with projects as materialized (
 select p.id,p.name,p.zone_id,p.is_active,
   jsonb_build_object('name',d.name) as developers,
   jsonb_build_object('name',z.name) as zones
 from public.projects p left join public.developers d on d.id=p.developer_id
 left join public.zones z on z.id=p.zone_id
 where (p_developer_id is null or p.developer_id=p_developer_id)
   and (p_unit_id is null or p.unit_id=p_unit_id)
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
 and l.blocked_at is null
 and (p_developer_id is null or exists(select 1 from projects p where p.id=l.project_id))
), suggestion_totals as materialized (
 -- Date-grain semantics, matching the admin's Guatemala calendar-day inputs.
 -- Reused by eventCounts and rankings; excludes zeroed historical groups.
 select nullif(d.source_project_id,repeat('0',32)::uuid) as source_id,
        nullif(d.target_project_id,repeat('0',32)::uuid)::text as target_id,
        sum(d.impressions)::bigint as impressions,sum(d.clicks)::bigint as clicks
 from public.analytics_suggestion_daily d
 where p_developer_id is null and p_from <= p_to
 and d.day >= (p_from at time zone 'America/Guatemala')::date
 and d.day <= (p_to at time zone 'America/Guatemala')::date
 and (d.impressions > 0 or d.clicks > 0)
 group by d.source_project_id,d.target_project_id
), counted_events as (
 -- Suggestions have the same hourly freshness in totals and rankings.
 select e.event_type from public.analytics_events e
 where p_developer_id is null and e.created_at >= p_from and e.created_at <= p_to
 and e.event_type not in ('suggested_project_impression','suggested_project_click')
 union all
 select e.event_type from projects p join public.analytics_events e on e.project_id=p.id
 where p_developer_id is not null and e.created_at >= p_from and e.created_at <= p_to
 -- Affiliates do not consume suggestion metrics; avoid their heap scan entirely.
 and e.event_type not in ('suggested_project_impression','suggested_project_click')
), event_counts as (
 select event_type::text as id,count(*) as count from counted_events group by event_type
 union all
 select 'suggested_project_impression',sum(impressions)::bigint
 from suggestion_totals having sum(impressions)>0
 union all
 select 'suggested_project_click',sum(clicks)::bigint
 from suggestion_totals having sum(clicks)>0
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
 select source_id,target_id,impressions,clicks from suggestion_totals
 where p_developer_id is null and p_include_suggestions
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
