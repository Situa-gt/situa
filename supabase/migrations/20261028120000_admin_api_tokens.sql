-- Personal tokens for the admin MCP server (/api/mcp). ADDITIVE: nothing reads it until the admin
-- code that uses it is deployed. Only the service role touches it; the plain token is never stored.
create table if not exists public.admin_api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_profiles (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  prefix text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists admin_api_tokens_user_idx on public.admin_api_tokens (user_id, created_at desc);
alter table public.admin_api_tokens enable row level security;
revoke all on public.admin_api_tokens from anon, authenticated;
