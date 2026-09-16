-- ADITIVA, segura antes del despliegue. ESCRITA, NO APLICADA.
-- Al aplicar, asignar fuera de Git: ALTER ROLE bot_inventory_reader PASSWORD '<secret-generated-outside-git>';
-- Vistas DEFINER (predeterminado), propiedad del rol de migraciones de confianza.
-- No exponer bot en la Data API; conexion propia por pooler.
-- UUID, published_at y display_order son exclusivamente internos al adaptador.
-- ORDER BY dentro de pricing LIMIT 1 selecciona el ganador, no ordena la vista.
-- Empates por id: el sitio no define desempate; verificar paridad antes de desplegar.
BEGIN;
CREATE SCHEMA bot;
REVOKE ALL ON SCHEMA bot FROM PUBLIC;
CREATE ROLE bot_inventory_reader LOGIN NOINHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
ALTER ROLE bot_inventory_reader SET default_transaction_read_only = on;
ALTER ROLE bot_inventory_reader SET statement_timeout = '8s';

CREATE VIEW bot.bot_public_projects
WITH (security_barrier = true) AS
SELECT
    p.id, p.name, p.slug, p.property_type, p.stage, p.created_at AS published_at,
    p.description, p.short_description,
    p.address_text, p.latitude, p.longitude, p.google_maps_url,
    p.base_currency, p.exchange_rate,
    p.amenities AS legacy_amenities,
    z.id AS zone_id, z.name AS zone_name, z.slug AS zone_slug, z.url_slug AS zone_url_slug,
    mu.name AS municipality_name, mu.slug AS municipality_slug,
    dep.name AS department_name, dep.slug AS department_slug,
    dev.id AS developer_id, dev.name AS developer_name,
    dev.slug AS developer_slug, dev.website AS developer_website,
    pricing.price_from, pricing.monthly_payment_from,
    inventory.active_model_count,
    'https://situa.gt/' || z.url_slug || '/' ||
      CASE p.property_type WHEN 'apartamento' THEN 'apartamentos' WHEN 'casa' THEN 'casas' END
      || '/' || p.slug AS url
FROM public.projects p
JOIN public.zones z ON z.id = p.zone_id AND z.is_active = true
JOIN public.municipalities mu ON mu.id = z.municipality_id AND mu.is_active = true
JOIN public.departments dep ON dep.id = mu.department_id AND dep.is_active = true
JOIN public.developers dev ON dev.id = p.developer_id AND dev.is_active = true
LEFT JOIN LATERAL (
    -- Regla: situa_vercel/src/lib/queries/pricing.ts, cheapestModelPricingByProject,
    -- invocado SIN normalizador en queries/index-pages.ts, fetchIndexProjects.
    -- Solo modelo activo y precio finito positivo; cuota DEL MISMO modelo ganador.
    -- La cuota invalida pasa a NULL; nunca se calcula MIN(monthly_payment_from).
    -- Los indices conservan moneda base; home.ts normaliza GTQ a USD al presentar.
    -- Desempate SQL por id: TS conserva la primera fila, SIN ORDER BY en index/home.
    -- La cuota de empates futuros no puede garantizar paridad hasta ordenar TS igual.
    SELECT m.price_from,
           CASE WHEN m.monthly_payment_from > 0
                  AND m.monthly_payment_from::text NOT IN ('NaN', 'Infinity', '-Infinity')
                THEN m.monthly_payment_from ELSE NULL END AS monthly_payment_from
    FROM public.models m
    WHERE m.project_id = p.id AND m.is_active = true
      AND m.price_from > 0
      AND m.price_from::text NOT IN ('NaN', 'Infinity', '-Infinity')
    ORDER BY m.price_from ASC, m.id ASC
    LIMIT 1
) pricing ON true
CROSS JOIN LATERAL (
    SELECT count(*) AS active_model_count
    FROM public.models m
    WHERE m.project_id = p.id AND m.is_active = true
) inventory
WHERE p.is_active = true
-- No publicar entidades cuya URL no pueda construirse.
  AND p.slug <> '' AND z.url_slug <> ''
;

CREATE VIEW bot.bot_public_models
WITH (security_barrier = true) AS
SELECT
    m.id, m.project_id, m.name, m.slug, m.description, m.display_order,
    m.size_m2, m.bedrooms, m.bathrooms, m.parking_spots,
    m.price_from, m.monthly_payment_from, m.amenities,
    m.has_balcony, m.has_service_room,
    p.base_currency, p.exchange_rate,
    p.url || '/' || m.slug AS url
FROM public.models m
JOIN bot.bot_public_projects p ON p.id = m.project_id
WHERE m.is_active = true AND m.slug <> ''
-- Conservar precio crudo aqui: apply.ts no exige price_from > 0 al filtrar.
-- El adaptador no debe afirmar precio/cuota positivos cuando el valor es invalido.
;

CREATE VIEW bot.bot_public_project_amenities
WITH (security_barrier = true) AS
SELECT pa.project_id, a.name, a.slug, a.icon
FROM public.project_amenities pa
JOIN bot.bot_public_projects p ON p.id = pa.project_id
JOIN public.amenities a ON a.id = pa.amenity_id AND a.is_active = true
-- Sin fallback sintetico aqui: si no hay filas visibles, usar p.legacy_amenities.
-- Esos nombres no tienen necesariamente slug/icon: no inventarlos.
;

CREATE VIEW bot.bot_public_media
WITH (security_barrier = true) AS
SELECT pm.id, pm.project_id, pm.model_id, pm.developer_id,
       pm.display_order, pm.kind, pm.url, pm.url_md, pm.url_sm, pm.alt, pm.width, pm.height
FROM public.project_media pm
LEFT JOIN bot.bot_public_projects p ON p.id = pm.project_id
LEFT JOIN bot.bot_public_models m ON m.id = pm.model_id
LEFT JOIN bot.bot_public_projects mp ON mp.id = m.project_id
LEFT JOIN public.developers d ON d.id = pm.developer_id AND d.is_active = true
-- project_media no tiene is_active: comprobar todos los padres indicados.
WHERE (pm.project_id IS NOT NULL OR pm.model_id IS NOT NULL OR pm.developer_id IS NOT NULL)
  AND (pm.project_id IS NULL OR p.id IS NOT NULL)
  AND (pm.model_id IS NULL OR m.id IS NOT NULL)
  AND (pm.developer_id IS NULL OR d.id IS NOT NULL)
  AND (pm.project_id IS NULL OR pm.model_id IS NULL OR m.project_id = p.id)
  AND (pm.developer_id IS NULL OR pm.project_id IS NULL OR p.developer_id = d.id)
  AND (pm.developer_id IS NULL OR pm.model_id IS NULL OR mp.developer_id = d.id)
;

CREATE VIEW bot.bot_public_zone_inventory
WITH (security_barrier = true) AS
SELECT p.zone_id, p.zone_name AS name, p.zone_url_slug AS url_slug,
       p.municipality_name AS municipality, p.municipality_slug,
       p.department_name AS department, p.department_slug,
       p.property_type,
       count(*) AS active_project_count,
       count(*) FILTER (WHERE p.active_model_count > 0)
           AS active_projects_with_active_models_count,
       'https://situa.gt/' || p.zone_url_slug || '/' ||
         CASE p.property_type WHEN 'apartamento' THEN 'apartamentos' WHEN 'casa' THEN 'casas' END
           AS index_url
FROM bot.bot_public_projects p
GROUP BY p.zone_id, p.zone_name, p.zone_url_slug, p.municipality_name,
         p.municipality_slug, p.department_name, p.department_slug, p.property_type;
-- Una fila por zona Y tipo, con index_url propio de ese tipo.
-- include_zero=true diagnostico no esta soportado por esta superficie de inventario.


REVOKE ALL ON ALL TABLES IN SCHEMA bot FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA bot TO bot_inventory_reader;
GRANT SELECT ON bot.bot_public_projects, bot.bot_public_models,
  bot.bot_public_project_amenities, bot.bot_public_media,
  bot.bot_public_zone_inventory TO bot_inventory_reader;
-- Sin membresias ni grants sobre public.*; filtros activos en las vistas.
COMMIT;
