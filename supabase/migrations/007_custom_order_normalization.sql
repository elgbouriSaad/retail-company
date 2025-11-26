BEGIN;

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

-- =========================
-- Data migration
-- =========================

-- 1) Move ponge items into custom_order_items
INSERT INTO public.custom_order_items (custom_order_id, description, position, created_at)
SELECT
  co.id AS custom_order_id,
  COALESCE(NULLIF(item.value->>'description', ''), CONCAT('Article ', item.ordinal::text)) AS description,
  (item.ordinal - 1) AS position,
  co.created_at
FROM public.custom_orders co
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(co.ponge_items, '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinal)
ON CONFLICT DO NOTHING;

-- 2) Move reference materials into custom_order_reference_materials
INSERT INTO public.custom_order_reference_materials (custom_order_id, name, description, quantity, position, created_at)
SELECT
  co.id,
  COALESCE(NULLIF(ref.value->>'name', ''), CONCAT('Ref #', ref.ordinal::text)) AS name,
  NULLIF(ref.value->>'description', '') AS description,
  CASE
    WHEN (ref.value->>'quantity') ~ '^-?\d+$' THEN GREATEST(0, (ref.value->>'quantity')::int)
    ELSE 1
  END AS quantity,
  (ref.ordinal - 1) AS position,
  co.created_at
FROM public.custom_orders co
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(co.reference_materials, '[]'::jsonb)) WITH ORDINALITY AS ref(value, ordinal)
ON CONFLICT DO NOTHING;

-- 3) Move image urls into custom_order_images
INSERT INTO public.custom_order_images (custom_order_id, url, position, created_at)
SELECT
  co.id,
  img.value AS url,
  (img.ordinal - 1) AS position,
  co.created_at
FROM public.custom_orders co
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(co.images, '[]'::jsonb)) WITH ORDINALITY AS img(value, ordinal)
ON CONFLICT DO NOTHING;

-- 4) Move payment schedule into custom_order_installments and custom_order_payments
WITH installment_data AS (
  SELECT
    co.id AS custom_order_id,
    sched.value AS payload,
    (sched.ordinal - 1) AS position
  FROM public.custom_orders co
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(co.payment_schedule, '[]'::jsonb)) WITH ORDINALITY AS sched(value, ordinal)
),
inserted_installments AS (
  INSERT INTO public.custom_order_installments (
    custom_order_id,
    due_date,
    amount,
    status,
    paid_date,
    paid_amount,
    method,
    notes,
    position,
    created_at,
    updated_at
  )
  SELECT
    custom_order_id,
    COALESCE(NULLIF(payload->>'dueDate', '')::date, now()::date) AS due_date,
    COALESCE(NULLIF(payload->>'amount', '')::numeric, 0)::numeric AS amount,
    COALESCE(NULLIF(UPPER(payload->>'status'), ''), 'PENDING')::public.custom_order_installment_status AS status,
    NULLIF(payload->>'paidDate', '')::date AS paid_date,
    NULLIF(payload->>'paidAmount', '')::numeric AS paid_amount,
    CASE
      WHEN NULLIF(payload->>'method', '') IS NULL THEN NULL
      WHEN UPPER(payload->>'method') IN ('CASH', 'CARD', 'CHECK', 'TRANSFER', 'MOBILE')
        THEN UPPER(payload->>'method')::public.custom_order_payment_method
      ELSE NULL
    END AS method,
    NULLIF(payload->>'notes', '') AS notes,
    position,
    now(),
    now()
  FROM installment_data
  RETURNING id, custom_order_id, position
)
INSERT INTO public.custom_order_payments (
  custom_order_id,
  installment_id,
  amount,
  method,
  paid_at,
  notes
)
SELECT
  inserted_installments.custom_order_id,
  inserted_installments.id,
  COALESCE(
    NULLIF(installment_data.payload->>'paidAmount', '')::numeric,
    NULLIF(installment_data.payload->>'amount', '')::numeric,
    0
  )::numeric AS amount,
  CASE
    WHEN NULLIF(installment_data.payload->>'method', '') IS NULL THEN 'CASH'
    WHEN UPPER(installment_data.payload->>'method') IN ('CASH', 'CARD', 'CHECK', 'TRANSFER', 'MOBILE')
      THEN UPPER(installment_data.payload->>'method')::public.custom_order_payment_method
    ELSE 'CASH'
  END AS method,
  COALESCE(NULLIF(installment_data.payload->>'paidDate', '')::timestamptz, now()) AS paid_at,
  NULLIF(installment_data.payload->>'notes', '') AS notes
FROM installment_data
JOIN inserted_installments
  ON inserted_installments.custom_order_id = installment_data.custom_order_id
 AND inserted_installments.position = installment_data.position
WHERE COALESCE(NULLIF(UPPER(installment_data.payload->>'status'), ''), 'PENDING') = 'PAID'
ON CONFLICT DO NOTHING;

-- 5) Drop legacy JSON columns now that data has been copied
ALTER TABLE public.custom_orders
  DROP COLUMN IF EXISTS ponge_items,
  DROP COLUMN IF EXISTS reference_materials,
  DROP COLUMN IF EXISTS images,
  DROP COLUMN IF EXISTS payment_schedule;

COMMIT;

