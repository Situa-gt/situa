alter type public.analytics_event_type add value if not exists 'contact_form_start';
alter type public.analytics_event_type add value if not exists 'contact_form_submit';
alter type public.analytics_event_type add value if not exists 'calculator_submit';

alter table public.analytics_events
  add column if not exists page_path text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists user_agent text;

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_type_created_at_idx
  on public.analytics_events (event_type, created_at desc);

create index if not exists analytics_events_project_created_at_idx
  on public.analytics_events (project_id, created_at desc)
  where project_id is not null;

create index if not exists analytics_events_model_created_at_idx
  on public.analytics_events (model_id, created_at desc)
  where model_id is not null;
