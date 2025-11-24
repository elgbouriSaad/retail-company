-- =====================================================
-- STORAGE POLICIES - SIMPLIFIED VERSION
-- =====================================================
-- This version uses simplified policies that should work
-- in the SQL Editor without special permissions
-- =====================================================

-- NOTE: If this still gives permission errors, you must create
-- policies through the Dashboard UI: Storage > Policies
-- =====================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PRODUCT IMAGES - PUBLIC BUCKET
-- =====================================================

-- Public read access for product images
CREATE POLICY IF NOT EXISTS "public_read_product_images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Authenticated users can upload to product-images
CREATE POLICY IF NOT EXISTS "authenticated_upload_product_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can update product-images
CREATE POLICY IF NOT EXISTS "authenticated_update_product_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Authenticated users can delete product-images
CREATE POLICY IF NOT EXISTS "authenticated_delete_product_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- =====================================================
-- CUSTOM ORDER IMAGES - PRIVATE BUCKET
-- =====================================================

-- Authenticated users can view custom order images
CREATE POLICY IF NOT EXISTS "authenticated_read_custom_images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'custom-order-images');

-- Authenticated users can upload custom order images
CREATE POLICY IF NOT EXISTS "authenticated_upload_custom_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'custom-order-images');

-- Authenticated users can update custom order images
CREATE POLICY IF NOT EXISTS "authenticated_update_custom_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'custom-order-images');

-- Authenticated users can delete custom order images
CREATE POLICY IF NOT EXISTS "authenticated_delete_custom_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'custom-order-images');

-- =====================================================
-- AVATARS - PRIVATE BUCKET
-- =====================================================

-- Users can view their own avatars (folder-based)
CREATE POLICY IF NOT EXISTS "users_read_own_avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own avatar
CREATE POLICY IF NOT EXISTS "users_upload_own_avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY IF NOT EXISTS "users_update_own_avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY IF NOT EXISTS "users_delete_own_avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- NOTES
-- =====================================================
-- This simplified version gives:
-- 1. Public read for product images
-- 2. All authenticated users can manage files (you can refine this later)
-- 3. Users can only manage their own avatars (folder-based isolation)
--
-- To add admin-only restrictions later, update policies through Dashboard UI
-- =====================================================

