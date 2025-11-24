-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- This migration sets up Row Level Security policies
-- to control access to data based on user roles and ownership
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'ADMIN'
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON users FOR SELECT
  USING (is_admin());

-- Users can update their own profile (except role and is_blocked)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid()) AND
    is_blocked = (SELECT is_blocked FROM users WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  USING (is_admin());

-- New users are created via trigger, no direct insert policy needed
-- But allow insert for the sync trigger
CREATE POLICY "Allow user creation via auth trigger"
  ON users FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Everyone can view available products (public read)
CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (availability = true);

-- Admins can view all products (including unavailable)
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (is_admin());

-- Admins can insert products
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update products
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (is_admin());

-- Admins can delete products
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can create orders for any user
CREATE POLICY "Admins can create any orders"
  ON orders FOR INSERT
  WITH CHECK (is_admin());

-- Users can update their own pending orders
CREATE POLICY "Users can update own pending orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'PENDING');

-- Admins can update any order
CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  USING (is_admin());

-- Users can delete their own pending orders
CREATE POLICY "Users can delete own pending orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id AND status = 'PENDING');

-- Admins can delete any order
CREATE POLICY "Admins can delete any order"
  ON orders FOR DELETE
  USING (is_admin());

-- =====================================================
-- ORDER ITEMS TABLE POLICIES
-- =====================================================

-- Users can view order items for their own orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can insert any order items
CREATE POLICY "Admins can insert any order items"
  ON order_items FOR INSERT
  WITH CHECK (is_admin());

-- Users can update order items for their own pending orders
CREATE POLICY "Users can update own order items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'PENDING'
    )
  );

-- Admins can update any order items
CREATE POLICY "Admins can update any order items"
  ON order_items FOR UPDATE
  USING (is_admin());

-- Users can delete order items from their own pending orders
CREATE POLICY "Users can delete own order items"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'PENDING'
    )
  );

-- Admins can delete any order items
CREATE POLICY "Admins can delete any order items"
  ON order_items FOR DELETE
  USING (is_admin());

-- =====================================================
-- CUSTOM ORDERS TABLE POLICIES
-- =====================================================

-- Note: Custom orders don't have user_id, they use client_name
-- Only admins can manage custom orders

-- Admins can view all custom orders
CREATE POLICY "Admins can view all custom orders"
  ON custom_orders FOR SELECT
  USING (is_admin());

-- Admins can insert custom orders
CREATE POLICY "Admins can insert custom orders"
  ON custom_orders FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update custom orders
CREATE POLICY "Admins can update custom orders"
  ON custom_orders FOR UPDATE
  USING (is_admin());

-- Admins can delete custom orders
CREATE POLICY "Admins can delete custom orders"
  ON custom_orders FOR DELETE
  USING (is_admin());

-- =====================================================
-- CONTACT MESSAGES TABLE POLICIES
-- =====================================================

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON contact_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON contact_messages FOR SELECT
  USING (is_admin());

-- Authenticated users can create messages
CREATE POLICY "Authenticated users can create messages"
  ON contact_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous messages (for contact form before login)
CREATE POLICY "Anyone can create anonymous messages"
  ON contact_messages FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Only admins can update messages (to add responses)
CREATE POLICY "Admins can update messages"
  ON contact_messages FOR UPDATE
  USING (is_admin());

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
  ON contact_messages FOR DELETE
  USING (is_admin());

-- =====================================================
-- SETTINGS TABLE POLICIES
-- =====================================================

-- Admins can view all settings
CREATE POLICY "Admins can view settings"
  ON settings FOR SELECT
  USING (is_admin());

-- Admins can insert settings
CREATE POLICY "Admins can insert settings"
  ON settings FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (is_admin());

-- Admins can delete settings
CREATE POLICY "Admins can delete settings"
  ON settings FOR DELETE
  USING (is_admin());

-- =====================================================
-- INVOICES TABLE POLICIES
-- =====================================================

-- Only admins can manage invoices
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update invoices"
  ON invoices FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  USING (is_admin());

-- =====================================================
-- PAYMENTS TABLE POLICIES
-- =====================================================

-- Only admins can manage payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  USING (is_admin());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to all tables for authenticated users (RLS will control actual access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

