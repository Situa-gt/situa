-- Deployment order: apply this additive migration -> deploy code -> verify.
-- Written only; NOT applied by this task.
alter type public.lead_channel add value if not exists 'bot';

alter table public.contact_leads
  add column qualification jsonb null,
  add column lead_score smallint null check (lead_score between 0 and 100),
  add column lead_tier text null check (lead_tier in ('premium', 'muy_bueno', 'bueno', 'regular')),
  add column conversation_id text null,
  add column recommended_project_ids uuid[] null;

create index contact_leads_conversation_id_idx
  on public.contact_leads (conversation_id) where conversation_id is not null;

-- Serialize concurrent inserts across server instances, not just within a process.
-- Invoker permissions; no elevated privileges or new public RPC.
create function public.enforce_bot_lead_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.channel::text = 'bot' and new.conversation_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(new.conversation_id, 0));
    if (select count(*) from public.contact_leads where conversation_id = new.conversation_id) >= 4 then
      raise exception using errcode = 'P0429', message = 'Conversation lead limit reached';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_bot_lead_limit() from public, anon, authenticated;
create trigger contact_leads_bot_limit before insert on public.contact_leads
  for each row execute function public.enforce_bot_lead_limit();
