-- =====================================================
-- STORAGE BUCKETS AND POLICIES
-- =====================================================
-- This migration sets up storage policies for file access
-- 
-- IMPORTANT: Storage buckets must be created manually first!
-- See instructions below before running this SQL.
-- =====================================================

-- =====================================================
-- STEP 1: CREATE STORAGE BUCKETS (DO THIS FIRST!)
-- =====================================================
-- You CANNOT create buckets via SQL in Supabase SQL Editor.
-- Create these buckets manually in the Supabase Dashboard:
--
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "New Bucket" and create these THREE buckets:
--
-- BUCKET 1: product-images
--   - Name: product-images
--   - Public: YES (check the box)
--   - File size limit: 10485760 (10MB)
--   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
--
-- BUCKET 2: custom-order-images
--   - Name: custom-order-images
--   - Public: NO (uncheck the box)
--   - File size limit: 10485760 (10MB)
--   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
--
-- BUCKET 3: avatars
--   - Name: avatars
--   - Public: NO (uncheck the box)
--   - File size limit: 5242880 (5MB)
--   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
--
-- After creating all three buckets, run this SQL file to set up the policies.
-- =====================================================

-- =====================================================
-- STORAGE POLICIES - PRODUCT IMAGES (PUBLIC)
-- =====================================================


-- Anyone can view product images (public bucket)
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admins can upload product images
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Admins can update product images
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Admins can delete product images
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STORAGE POLICIES - CUSTOM ORDER IMAGES (PRIVATE)
-- =====================================================


-- Admins can view all custom order images
CREATE POLICY "Admins can view custom order images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'custom-order-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Admins can upload custom order images
CREATE POLICY "Admins can upload custom order images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-order-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Admins can update custom order images
CREATE POLICY "Admins can update custom order images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'custom-order-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Admins can delete custom order images
CREATE POLICY "Admins can delete custom order images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'custom-order-images' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STORAGE POLICIES - AVATARS (PRIVATE)
-- =====================================================



-- Users can view their own avatar
CREATE POLICY "Users can view own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all avatars
CREATE POLICY "Admins can view all avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Users can upload their own avatar (organized by user_id folder)
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars' AND
    (
      SELECT role = 'ADMIN'
      FROM users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- HELPER COMMENTS
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
COMMENT ON TABLE storage.objects IS 'Stored files with access control';

-- =====================================================
-- STORAGE USAGE EXAMPLES
-- =====================================================

-- Example paths:
-- Product images: product-images/product-{uuid}/image-{timestamp}.jpg
-- Custom order images: custom-order-images/order-{uuid}/image-{timestamp}.jpg
-- User avatars: avatars/{user-uuid}/avatar.jpg

