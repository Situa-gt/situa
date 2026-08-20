
-- monthly_payment_from on models (developer-typed, USD)
ALTER TABLE models ADD COLUMN IF NOT EXISTS monthly_payment_from decimal(12,2);

-- temporary migration tracking table (dropped after launch)
CREATE TABLE IF NOT EXISTS bubble_migration_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_id     text NOT NULL,
  supabase_id   uuid NOT NULL,
  table_name    text NOT NULL,
  migrated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bubble_id, table_name)
);
;
