-- =====================================================
-- SUPABASE DATABASE SCHEMA - RETAIL COMPANY PLATFORM
-- =====================================================
-- This migration creates the complete database schema
-- for a retail/sewing company with authentication,
-- products, orders, invoices, and payments
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Product categories
CREATE TYPE product_category AS ENUM (
  'FABRICS',
  'CLOTHES',
  'KITS',
  'THREADS',
  'ACCESSORIES'
);

-- Order status
CREATE TYPE order_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'DELIVERED',
  'CANCELLED'
);

-- Message status
CREATE TYPE message_status AS ENUM (
  'UNREAD',
  'READ',
  'RESPONDED'
);

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'PAID',
  'PARTIAL',
  'UNPAID'
);

-- Payment method
CREATE TYPE payment_method AS ENUM (
  'CASH',
  'CARD',
  'CHECK',
  'TRANSFER',
  'MOBILE'
);

-- Discount type
CREATE TYPE discount_type AS ENUM (
  'PERCENTAGE',
  'AMOUNT'
);

-- Payment installment status
CREATE TYPE installment_status AS ENUM (
  'PAID',
  'PENDING',
  'OVERDUE'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase Auth)
-- Note: This syncs with auth.users via trigger
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role DEFAULT 'USER' NOT NULL,
  phone text,
  address text,
  avatar text, -- URL to avatar in storage
  is_blocked boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  category product_category NOT NULL,
  images jsonb DEFAULT '[]'::jsonb NOT NULL, -- Array of image URLs
  sizes jsonb DEFAULT '[]'::jsonb NOT NULL, -- Array of available sizes
  stock integer DEFAULT 0 NOT NULL CHECK (stock >= 0),
  availability boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status order_status DEFAULT 'PENDING' NOT NULL,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Order Items table (products in an order)
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL, -- Snapshot of product name at order time
  quantity integer NOT NULL CHECK (quantity > 0),
  size text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0), -- Snapshot of price at order time
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Custom Orders table (tailored/custom orders with payment schedules)
CREATE TABLE custom_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  phone_number text NOT NULL,
  ponge_items jsonb DEFAULT '[]'::jsonb NOT NULL, -- Array of ponge items
  reference_materials jsonb DEFAULT '[]'::jsonb NOT NULL, -- Array of reference materials
  images jsonb DEFAULT '[]'::jsonb, -- Array of image URLs
  start_date timestamptz,
  finish_date timestamptz NOT NULL,
  down_payment numeric(10, 2) NOT NULL CHECK (down_payment >= 0),
  advance_money numeric(10, 2) DEFAULT 0 NOT NULL CHECK (advance_money >= 0),
  payment_months integer NOT NULL CHECK (payment_months > 0),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  status order_status DEFAULT 'PENDING' NOT NULL,
  payment_schedule jsonb DEFAULT '[]'::jsonb, -- Array of payment installments
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Contact Messages table
CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  status message_status DEFAULT 'UNREAD' NOT NULL,
  response text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Settings table (key-value store)
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  client_id text NOT NULL,
  client_name text NOT NULL,
  date timestamptz NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL, -- Array of invoice items
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_type discount_type,
  discount_value numeric(10, 2) CHECK (discount_value >= 0),
  total numeric(10, 2) NOT NULL CHECK (total >= 0),
  amount_paid numeric(10, 2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
  amount_due numeric(10, 2) NOT NULL CHECK (amount_due >= 0),
  status invoice_status NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  method payment_method NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  date timestamptz NOT NULL,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_availability ON products(availability);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops); -- Fuzzy search

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_updated_at ON orders(updated_at DESC);

-- Order Items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Custom Orders indexes
CREATE INDEX idx_custom_orders_status ON custom_orders(status);
CREATE INDEX idx_custom_orders_finish_date ON custom_orders(finish_date);
CREATE INDEX idx_custom_orders_created_at ON custom_orders(created_at DESC);
CREATE INDEX idx_custom_orders_client_name ON custom_orders(client_name);

-- Contact Messages indexes
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX idx_contact_messages_product_id ON contact_messages(product_id);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Settings indexes
CREATE UNIQUE INDEX idx_settings_key ON settings(key);

-- Invoices indexes
CREATE UNIQUE INDEX idx_invoices_reference ON invoices(reference);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date DESC);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Payments indexes
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(date DESC);
CREATE INDEX idx_payments_method ON payments(method);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'User profiles synced with Supabase Auth';
COMMENT ON TABLE products IS 'Product catalog for retail items';
COMMENT ON TABLE orders IS 'Standard customer orders';
COMMENT ON TABLE order_items IS 'Line items for each order';
COMMENT ON TABLE custom_orders IS 'Custom/tailored orders with payment schedules';
COMMENT ON TABLE contact_messages IS 'Customer inquiries and support messages';
COMMENT ON TABLE settings IS 'System configuration key-value store';
COMMENT ON TABLE invoices IS 'Invoice records for billing';
COMMENT ON TABLE payments IS 'Payment records linked to invoices';

COMMENT ON COLUMN products.images IS 'JSONB array of image URLs from storage';
COMMENT ON COLUMN products.sizes IS 'JSONB array of available size options';
COMMENT ON COLUMN custom_orders.payment_schedule IS 'JSONB array of payment installments with status';
COMMENT ON COLUMN invoices.items IS 'JSONB array of invoice line items';

