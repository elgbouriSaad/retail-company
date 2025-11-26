-- Custom Order Normalization (No Data Migration)
-- Use this if tables already exist and you don't have data to migrate
BEGIN;

-- Create enums if they don't exist
DO $$
BEGIN
  CREATE TYPE public.custom_order_installment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.custom_order_payment_method AS ENUM ('CASH', 'CARD', 'CHECK', 'TRANSFER', 'MOBILE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.custom_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.custom_order_reference_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_reference_materials_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.custom_order_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_images_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.custom_order_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  status custom_order_installment_status NOT NULL DEFAULT 'PENDING',
  paid_date date,
  paid_amount numeric CHECK (paid_amount >= 0::numeric),
  method custom_order_payment_method,
  notes text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_installments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.custom_order_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  installment_id uuid REFERENCES public.custom_order_installments(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  method custom_order_payment_method NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_payments_pkey PRIMARY KEY (id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS custom_order_items_order_id_idx
  ON public.custom_order_items (custom_order_id, position);

CREATE INDEX IF NOT EXISTS custom_order_ref_materials_order_id_idx
  ON public.custom_order_reference_materials (custom_order_id, position);

CREATE INDEX IF NOT EXISTS custom_order_images_order_id_idx
  ON public.custom_order_images (custom_order_id, position);

CREATE INDEX IF NOT EXISTS custom_order_installments_order_id_due_date_idx
  ON public.custom_order_installments (custom_order_id, due_date);

CREATE INDEX IF NOT EXISTS custom_order_payments_order_id_idx
  ON public.custom_order_payments (custom_order_id, paid_at);

-- Drop old JSON columns from custom_orders if they still exist
ALTER TABLE public.custom_orders
  DROP COLUMN IF EXISTS ponge_items,
  DROP COLUMN IF EXISTS reference_materials,
  DROP COLUMN IF EXISTS images,
  DROP COLUMN IF EXISTS payment_schedule;

COMMIT;

