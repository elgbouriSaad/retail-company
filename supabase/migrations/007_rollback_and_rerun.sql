-- Rollback script: Drop new tables so we can re-run the migration
BEGIN;

DROP TABLE IF EXISTS public.custom_order_payments CASCADE;
DROP TABLE IF EXISTS public.custom_order_installments CASCADE;
DROP TABLE IF EXISTS public.custom_order_images CASCADE;
DROP TABLE IF EXISTS public.custom_order_reference_materials CASCADE;
DROP TABLE IF EXISTS public.custom_order_items CASCADE;

DROP TYPE IF EXISTS public.custom_order_payment_method CASCADE;
DROP TYPE IF EXISTS public.custom_order_installment_status CASCADE;

-- Re-add the JSON columns if they were dropped
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS ponge_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reference_materials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_schedule jsonb;

COMMIT;

