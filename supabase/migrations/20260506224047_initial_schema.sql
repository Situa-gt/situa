-- =====================================================================
-- Sitúa.gt — initial schema (v1)
-- Source of truth: docs/data-model.md
-- =====================================================================

-- Enums --------------------------------------------------------------------
CREATE TYPE property_type AS ENUM ('apartamento', 'casa');
CREATE TYPE project_stage AS ENUM ('lanzamiento', 'preventa', 'construccion', 'entrega_inmediata');
CREATE TYPE currency_code AS ENUM ('USD', 'GTQ');
CREATE TYPE media_kind    AS ENUM ('cover', 'gallery', 'floorplan', 'logo');
CREATE TYPE lead_channel  AS ENUM ('form');

-- Shared trigger -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- departments --------------------------------------------------------------
CREATE TABLE public.departments (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  slug      text UNIQUE NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 80),
  is_active boolean NOT NULL DEFAULT true
);

-- municipalities -----------------------------------------------------------
CREATE TABLE public.municipalities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  name          text NOT NULL,
  slug          text NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 80),
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (department_id, slug)
);
CREATE INDEX idx_municipalities_department_id ON public.municipalities(department_id);

-- zones --------------------------------------------------------------------
CREATE TABLE public.zones (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id       uuid NOT NULL REFERENCES public.municipalities(id) ON DELETE RESTRICT,
  name                  text NOT NULL,
  slug                  text NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 80),
  url_slug              text UNIQUE NOT NULL CHECK (char_length(url_slug) BETWEEN 2 AND 80),
  is_canonical_for_slug boolean NOT NULL DEFAULT false,
  display_order         integer NOT NULL DEFAULT 0,
  is_active             boolean NOT NULL DEFAULT true,
  UNIQUE (municipality_id, slug)
);
CREATE INDEX idx_zones_municipality_id ON public.zones(municipality_id);
-- Exactly one canonical per shared slug
CREATE UNIQUE INDEX idx_zones_canonical_per_slug
  ON public.zones(slug) WHERE is_canonical_for_slug = true;

-- developers ---------------------------------------------------------------
CREATE TABLE public.developers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  slug                text UNIQUE NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 80),
  website             text,
  contact_email       text,
  notification_emails text[],
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects -----------------------------------------------------------------
CREATE TABLE public.projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id      uuid NOT NULL REFERENCES public.developers(id) ON DELETE RESTRICT,
  zone_id           uuid NOT NULL REFERENCES public.zones(id) ON DELETE RESTRICT,
  name              text NOT NULL,
  slug              text NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 80),
  property_type     property_type NOT NULL,
  stage             project_stage NOT NULL,
  description       text,
  short_description text,
  amenities         text[],
  latitude          decimal(10,8),
  longitude         decimal(11,8),
  google_maps_url   text,
  base_currency     currency_code NOT NULL DEFAULT 'USD',
  exchange_rate     decimal(10,4) NOT NULL DEFAULT 7.7000 CHECK (exchange_rate > 0),
  is_featured       boolean NOT NULL DEFAULT false,
  featured_priority integer NOT NULL DEFAULT 0,
  featured_until    timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  legacy_slugs      text[] NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zone_id, slug)
);
CREATE INDEX idx_projects_developer_id ON public.projects(developer_id);
CREATE INDEX idx_projects_zone_id      ON public.projects(zone_id);
CREATE INDEX idx_projects_listing
  ON public.projects(is_active, is_featured, featured_priority DESC, created_at DESC);
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- models -------------------------------------------------------------------
CREATE TABLE public.models (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name          text NOT NULL,
  slug          text NOT NULL CHECK (char_length(slug) BETWEEN 2 AND 80),
  description   text,
  size_m2       decimal(8,2),
  bedrooms      integer,
  bathrooms     decimal(3,1),
  parking_spots integer NOT NULL DEFAULT 0,
  price_from    decimal(12,2) NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  legacy_slugs  text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);
CREATE INDEX idx_models_project_id ON public.models(project_id);
CREATE TRIGGER trg_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- project_media ------------------------------------------------------------
CREATE TABLE public.project_media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES public.projects(id)   ON DELETE CASCADE,
  model_id      uuid REFERENCES public.models(id)     ON DELETE CASCADE,
  developer_id  uuid REFERENCES public.developers(id) ON DELETE CASCADE,
  kind          media_kind NOT NULL,
  url           text NOT NULL,
  url_md        text,
  url_sm        text,
  blur_data_url text,
  alt           text,
  width         integer,
  height        integer,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'logo'      AND developer_id IS NOT NULL AND project_id IS NULL) OR
    (kind = 'floorplan' AND model_id IS NOT NULL     AND project_id IS NOT NULL) OR
    (kind IN ('cover', 'gallery') AND project_id IS NOT NULL)
  )
);
CREATE INDEX idx_project_media_project_id   ON public.project_media(project_id);
CREATE INDEX idx_project_media_model_id     ON public.project_media(model_id);
CREATE INDEX idx_project_media_developer_id ON public.project_media(developer_id);

-- contact_leads ------------------------------------------------------------
CREATE TABLE public.contact_leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  model_id     uuid REFERENCES public.models(id) ON DELETE SET NULL,
  full_name    text NOT NULL,
  email        text NOT NULL,
  phone        text,
  message      text,
  channel      lead_channel NOT NULL DEFAULT 'form',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_leads_project_id ON public.contact_leads(project_id);
CREATE INDEX idx_contact_leads_model_id   ON public.contact_leads(model_id);
CREATE INDEX idx_contact_leads_created_at ON public.contact_leads(created_at DESC);

-- legacy_redirects ---------------------------------------------------------
CREATE TABLE public.legacy_redirects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_path    text UNIQUE NOT NULL,
  new_path    text NOT NULL,
  status_code integer NOT NULL DEFAULT 308,
  hits        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================

-- Public-read with is_active filter
ALTER TABLE public.departments     ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active" ON public.departments
  FOR SELECT TO anon, authenticated USING (is_active = true);

ALTER TABLE public.municipalities  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active" ON public.municipalities
  FOR SELECT TO anon, authenticated USING (is_active = true);

ALTER TABLE public.zones           ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active" ON public.zones
  FOR SELECT TO anon, authenticated USING (is_active = true);

ALTER TABLE public.developers      ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active" ON public.developers
  FOR SELECT TO anon, authenticated USING (is_active = true);

ALTER TABLE public.projects        ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active" ON public.projects
  FOR SELECT TO anon, authenticated USING (is_active = true);

ALTER TABLE public.models          ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active" ON public.models
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Public-read without is_active column
ALTER TABLE public.project_media   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.project_media
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.legacy_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.legacy_redirects
  FOR SELECT TO anon, authenticated USING (true);

-- contact_leads: anon insert, no select (service role only via bypass)
ALTER TABLE public.contact_leads   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert" ON public.contact_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
;
