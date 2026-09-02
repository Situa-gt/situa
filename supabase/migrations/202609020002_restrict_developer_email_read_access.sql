-- RESTRICTIVA: apply only after the server-side recipient resolver is deployed.
-- PostgreSQL table-level SELECT would override a column revoke, so replace the
-- public table grant with grants for the explicitly public columns only.

REVOKE SELECT ON TABLE public.developers FROM anon, authenticated;

GRANT SELECT (
  id,
  name,
  slug,
  website,
  is_active,
  created_at,
  updated_at
) ON TABLE public.developers TO anon, authenticated;

