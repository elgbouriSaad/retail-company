-- =====================================================
-- CURRENT DATABASE SCHEMA
-- =====================================================
-- Auto-generated: 2024-11-26
-- Database: Supabase PostgreSQL
-- Purpose: Reference schema for retail company platform
-- =====================================================

-- =====================================================
-- ACTIVE TABLES
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'USER', -- USER or ADMIN
  phone text,
  address text,
  avatar text,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  category text NOT NULL, -- FABRICS, CLOTHES, KITS, THREADS, ACCESSORIES
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  availability boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  category_id uuid,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  cover_image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Custom Orders table
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  phone_number text NOT NULL,
  start_date timestamp with time zone,
  finish_date timestamp with time zone NOT NULL,
  down_payment numeric NOT NULL CHECK (down_payment >= 0::numeric),
  advance_money numeric NOT NULL DEFAULT 0 CHECK (advance_money >= 0::numeric),
  payment_months integer NOT NULL CHECK (payment_months > 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  status text NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, DELIVERED, CANCELLED
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_orders_pkey PRIMARY KEY (id)
);

-- Custom Order Items table
CREATE TABLE IF NOT EXISTS public.custom_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL,
  description text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT custom_order_items_order_fkey FOREIGN KEY (custom_order_id) 
    REFERENCES public.custom_orders(id) ON DELETE CASCADE
);

-- Custom Order Reference Materials table
CREATE TABLE IF NOT EXISTS public.custom_order_reference_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_reference_materials_pkey PRIMARY KEY (id),
  CONSTRAINT custom_order_reference_materials_order_fkey FOREIGN KEY (custom_order_id) 
    REFERENCES public.custom_orders(id) ON DELETE CASCADE
);

-- Custom Order Images table
CREATE TABLE IF NOT EXISTS public.custom_order_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_images_pkey PRIMARY KEY (id),
  CONSTRAINT custom_order_images_order_fkey FOREIGN KEY (custom_order_id) 
    REFERENCES public.custom_orders(id) ON DELETE CASCADE
);

-- Custom Order Installments table
CREATE TABLE IF NOT EXISTS public.custom_order_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  status text NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE
  paid_date date,
  paid_amount numeric CHECK (paid_amount >= 0::numeric),
  method text, -- CASH, CARD, CHECK, TRANSFER, MOBILE
  notes text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_installments_pkey PRIMARY KEY (id),
  CONSTRAINT custom_order_installments_order_fkey FOREIGN KEY (custom_order_id) 
    REFERENCES public.custom_orders(id) ON DELETE CASCADE
);

-- Custom Order Payments table
CREATE TABLE IF NOT EXISTS public.custom_order_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  custom_order_id uuid NOT NULL,
  installment_id uuid,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  method text NOT NULL, -- CASH, CARD, CHECK, TRANSFER, MOBILE
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_order_payments_pkey PRIMARY KEY (id),
  CONSTRAINT custom_order_payments_order_fkey FOREIGN KEY (custom_order_id) 
    REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  CONSTRAINT custom_order_payments_installment_fkey FOREIGN KEY (installment_id) 
    REFERENCES public.custom_order_installments(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- NOTE: RLS policies are defined in migration 011_add_rls_policies.sql
-- All tables have RLS enabled with admin-only access for custom orders
-- and public read access for products/categories

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- NOTE: Storage buckets are managed through Supabase Dashboard
-- Required buckets:
--   - product-images (public)
--   - custom-order-images (public)
--   - category-images (public)

-- =====================================================
-- DEPRECATED/REMOVED TABLES (for reference)
-- =====================================================

-- The following tables were removed during refactoring:
-- These are kept as comments for historical reference

/*
-- orders table (DEPRECATED - replaced by custom_orders)
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- order_items table (DEPRECATED - replaced by custom_order_items)
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  size text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- invoices table (REMOVED - functionality not implemented)
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  client_id text NOT NULL,
  client_name text NOT NULL,
  date timestamp with time zone NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  discount_type text,
  discount_value numeric CHECK (discount_value >= 0::numeric),
  total numeric NOT NULL CHECK (total >= 0::numeric),
  amount_paid numeric NOT NULL DEFAULT 0 CHECK (amount_paid >= 0::numeric),
  amount_due numeric NOT NULL CHECK (amount_due >= 0::numeric),
  status text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id)
);

-- payments table (REMOVED - replaced by custom_order_payments)
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  method text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  date timestamp with time zone NOT NULL,
  reference text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);

-- contact_messages table (REMOVED - functionality not implemented)
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  product_id uuid,
  status text NOT NULL DEFAULT 'UNREAD',
  response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT contact_messages_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- settings table (REMOVED - functionality not implemented)
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
