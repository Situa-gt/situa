WITH dept AS (
  INSERT INTO departments (name, slug, is_active)
  VALUES ('Guatemala', 'guatemala', true)
  RETURNING id
),
muni AS (
  INSERT INTO municipalities (department_id, name, slug, is_active)
  SELECT id, 'Guatemala', 'guatemala', true FROM dept
  RETURNING id
),
zone AS (
  INSERT INTO zones (municipality_id, name, slug, url_slug, is_canonical_for_slug, display_order, is_active)
  SELECT id, 'Zona 10', 'zona-10', 'zona-10', true, 0, true FROM muni
  RETURNING id
),
dev AS (
  INSERT INTO developers (name, slug, is_active)
  VALUES ('Axis Desarrollos', 'axis-desarrollos', true)
  RETURNING id
),
proj AS (
  INSERT INTO projects (
    developer_id, zone_id, name, slug, property_type, stage,
    short_description, description,
    base_currency, exchange_rate, is_active
  )
  SELECT
    dev.id, zone.id, 'Zima', 'zima', 'apartamento'::property_type, 'preventa'::project_stage,
    'Apartamentos en preventa en Zona 10.',
    'Proyecto de prueba para Sitúa.gt en Zona 10 de la ciudad de Guatemala.',
    'USD'::currency_code, 7.7000, true
  FROM dev, zone
  RETURNING id
)
INSERT INTO models (
  project_id, name, slug, description,
  size_m2, bedrooms, bathrooms, parking_spots,
  price_from, is_active, display_order
)
SELECT
  proj.id, '2 Habitaciones', '2-habitaciones',
  'Modelo de dos habitaciones, ideal para parejas o inversión.',
  78.50, 2, 2.0, 1,
  180000.00, true, 0
FROM proj;;
