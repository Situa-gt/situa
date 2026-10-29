-- One sent bot lead per conversation and project. ADDITIVE: no duplicates existed when it was
-- written (checked 28-10-2026). Protects against a bot retry after a timeout creating a second lead,
-- and a second email to the developer; the site returns the stored lead instead.
create unique index if not exists contact_leads_bot_conversation_project_uq
  on public.contact_leads (conversation_id, project_id)
  where channel = 'bot' and conversation_id is not null and not is_warm;
