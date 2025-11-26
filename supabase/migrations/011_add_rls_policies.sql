-- =====================================================
-- ADD RLS POLICIES FOR ALL TABLES
-- =====================================================
-- Migration: 011_add_rls_policies
-- Date: 2024-11-26
-- Description: Enable Row Level Security and add policies
--              for all tables to secure the database
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is admin (if not exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
END;
$$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_reference_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================

-- Allow everyone to read categories (public catalog)
CREATE POLICY "Anyone can view categories"
ON public.categories
FOR SELECT
USING (true);

-- Only admins can insert categories
CREATE POLICY "Only admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update categories
CREATE POLICY "Only admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Allow everyone to read products (public catalog)
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

-- Only admins can insert products
CREATE POLICY "Only admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update products
CREATE POLICY "Only admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete products
CREATE POLICY "Only admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile, admins view all"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
);

-- Users can update their own profile, admins can update all
CREATE POLICY "Users can update own profile, admins update all"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CUSTOM_ORDERS TABLE POLICIES
-- =====================================================

-- Only admins can view custom orders
CREATE POLICY "Only admins can view custom orders"
ON public.custom_orders
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert custom orders
CREATE POLICY "Only admins can insert custom orders"
ON public.custom_orders
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update custom orders
CREATE POLICY "Only admins can update custom orders"
ON public.custom_orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete custom orders
CREATE POLICY "Only admins can delete custom orders"
ON public.custom_orders
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CUSTOM_ORDER_ITEMS TABLE POLICIES
-- =====================================================

-- Only admins can view custom order items
CREATE POLICY "Only admins can view custom order items"
ON public.custom_order_items
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert custom order items
CREATE POLICY "Only admins can insert custom order items"
ON public.custom_order_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update custom order items
CREATE POLICY "Only admins can update custom order items"
ON public.custom_order_items
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete custom order items
CREATE POLICY "Only admins can delete custom order items"
ON public.custom_order_items
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CUSTOM_ORDER_REFERENCE_MATERIALS TABLE POLICIES
-- =====================================================

-- Only admins can view custom order reference materials
CREATE POLICY "Only admins can view reference materials"
ON public.custom_order_reference_materials
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert custom order reference materials
CREATE POLICY "Only admins can insert reference materials"
ON public.custom_order_reference_materials
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update custom order reference materials
CREATE POLICY "Only admins can update reference materials"
ON public.custom_order_reference_materials
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete custom order reference materials
CREATE POLICY "Only admins can delete reference materials"
ON public.custom_order_reference_materials
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CUSTOM_ORDER_IMAGES TABLE POLICIES
-- =====================================================

-- Only admins can view custom order images
CREATE POLICY "Only admins can view custom order images"
ON public.custom_order_images
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert custom order images
CREATE POLICY "Only admins can insert custom order images"
ON public.custom_order_images
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update custom order images
CREATE POLICY "Only admins can update custom order images"
ON public.custom_order_images
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete custom order images
CREATE POLICY "Only admins can delete custom order images"
ON public.custom_order_images
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CUSTOM_ORDER_INSTALLMENTS TABLE POLICIES
-- =====================================================

-- Only admins can view custom order installments
CREATE POLICY "Only admins can view installments"
ON public.custom_order_installments
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert custom order installments
CREATE POLICY "Only admins can insert installments"
ON public.custom_order_installments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update custom order installments
CREATE POLICY "Only admins can update installments"
ON public.custom_order_installments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete custom order installments
CREATE POLICY "Only admins can delete installments"
ON public.custom_order_installments
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- CUSTOM_ORDER_PAYMENTS TABLE POLICIES
-- =====================================================

-- Only admins can view custom order payments
CREATE POLICY "Only admins can view payments"
ON public.custom_order_payments
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert custom order payments
CREATE POLICY "Only admins can insert payments"
ON public.custom_order_payments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update custom order payments
CREATE POLICY "Only admins can update payments"
ON public.custom_order_payments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete custom order payments
CREATE POLICY "Only admins can delete payments"
ON public.custom_order_payments
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- GRANT USAGE ON HELPER FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify RLS is enabled on all tables:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity as rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Run this to see all policies:
--
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

