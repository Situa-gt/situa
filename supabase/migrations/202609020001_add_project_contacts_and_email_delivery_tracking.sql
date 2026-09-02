-- ADITIVA: safe to apply before the application deploy.

CREATE TABLE public.project_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email       text NOT NULL CHECK (email = btrim(email) AND email <> ''),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_contacts_project_id_idx
  ON public.project_contacts(project_id);

CREATE UNIQUE INDEX project_contacts_project_id_email_lower_idx
  ON public.project_contacts(project_id, lower(email));

ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

-- The admin uses the service role, which bypasses RLS. Public roles receive no
-- policy and no table privileges, so project recipients remain server-only.
REVOKE ALL ON TABLE public.project_contacts FROM anon, authenticated;
GRANT ALL ON TABLE public.project_contacts TO service_role;

ALTER TABLE public.contact_leads
  ADD COLUMN email_attempted_at timestamptz,
  ADD COLUMN email_sent_at timestamptz,
  ADD COLUMN email_error text;

