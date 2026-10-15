-- Heat map of the home premium spaces: views and clicks per space and card position.
-- Additive: admin_home_slots_summary stays as it is.
create or replace function public.admin_home_slots_heatmap(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with ev as (
    select e.event_type::text as kind, e.filters->>'slot' as slot,
           case when (e.filters->>'position') ~ '^[0-9]{1,3}$' then (e.filters->>'position')::int end as position
    from public.analytics_events e
    where e.created_at >= p_from and e.created_at <= p_to
      and e.event_type::text in ('home_slot_impression','home_slot_click')
      and e.filters ? 'slot'
  ), cells as (
    select slot, position,
           count(*) filter (where kind = 'home_slot_impression') as impressions,
           count(*) filter (where kind = 'home_slot_click') as clicks
    from ev where position between 1 and 200
    group by slot, position
  )
  select coalesce(jsonb_agg(jsonb_build_object('slot', slot, 'position', position,
    'impressions', impressions, 'clicks', clicks) order by slot, position), '[]'::jsonb)
  from cells;
$$;

revoke all on function public.admin_home_slots_heatmap(timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.admin_home_slots_heatmap(timestamptz,timestamptz) to service_role;
