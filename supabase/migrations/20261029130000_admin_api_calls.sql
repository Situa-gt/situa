-- Usage log of the admin MCP server: one row per tool call (which token, which tool, result, time).
-- Also the basis of the per-token rate limit. ADDITIVE; only the service role touches it.
create table if not exists public.admin_api_calls (
  id bigint generated always as identity primary key,
  token_id uuid not null references public.admin_api_tokens (id) on delete cascade,
  tool text not null,
  ok boolean not null,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists admin_api_calls_token_idx on public.admin_api_calls (token_id, created_at desc);
alter table public.admin_api_calls enable row level security;
revoke all on public.admin_api_calls from anon, authenticated;
