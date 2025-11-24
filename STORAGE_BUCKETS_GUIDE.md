# Storage Buckets Setup Guide

## ⚠️ Important: Create Buckets Before Running SQL

Storage buckets in Supabase **cannot be created via SQL** in the standard SQL Editor. You must create them through the Dashboard UI first, then run the policies SQL.

---

## 📝 Step-by-Step Instructions

### Step 1: Navigate to Storage

1. Open your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. You should see an empty list (or any existing buckets)

### Step 2: Create Bucket 1 - Product Images (Public)

1. Click **"New Bucket"** button (top right)
2. Fill in the form:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **CHECK THIS BOX** (this bucket is public)
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     image/gif
     ```
     (Add each on a separate line)
3. Click **"Create bucket"**
4. ✅ Success! You should see `product-images` in your bucket list

### Step 3: Create Bucket 2 - Custom Order Images (Private)

1. Click **"New Bucket"** again
2. Fill in the form:
   - **Name**: `custom-order-images`
   - **Public bucket**: ❌ **UNCHECK THIS BOX** (this bucket is private)
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     image/gif
     ```
3. Click **"Create bucket"**
4. ✅ Success!

### Step 4: Create Bucket 3 - Avatars (Private)

1. Click **"New Bucket"** again
2. Fill in the form:
   - **Name**: `avatars`
   - **Public bucket**: ❌ **UNCHECK THIS BOX** (this bucket is private)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     ```
     (Note: No GIF support for avatars)
3. Click **"Create bucket"**
4. ✅ Success!

### Step 5: Verify Buckets Created

You should now see **3 buckets** in your Storage list:
- ✅ `product-images` (with a 🌐 public icon)
- ✅ `custom-order-images` (with a 🔒 lock icon)
- ✅ `avatars` (with a 🔒 lock icon)

### Step 6: Run Storage Policies SQL

Now that the buckets exist, you can run the policies:

1. Go to **SQL Editor**
2. Open `supabase/migrations/003_storage_setup.sql`
3. Copy the **entire file** contents
4. Paste into SQL Editor
5. Click **"Run"**
6. ✅ Success! Policies are now applied

---

## 🔍 Verify Setup

### Test Product Images (Public)
1. Go to Storage → `product-images`
2. Try uploading a test image
3. Click on the image to see its public URL
4. Copy the URL and open it in a new browser tab
5. ✅ Image should load without authentication

### Test Private Buckets
1. Go to Storage → `avatars`
2. Try uploading a test image
3. The image should upload successfully
4. Note: Private bucket URLs require authentication

---

## 📊 Bucket Summary

| Bucket Name | Public? | Size Limit | Purpose |
|-------------|---------|------------|---------|
| `product-images` | ✅ Yes | 10MB | Product catalog photos (accessible to everyone) |
| `custom-order-images` | ❌ No | 10MB | Custom order reference images (admin only) |
| `avatars` | ❌ No | 5MB | User profile pictures (owner + admin only) |

---

## 🐛 Troubleshooting

### "Bucket already exists" error
- This is fine! It means the bucket was already created.
- Continue to the next bucket or run the SQL policies.

### Can't upload files
- Make sure policies are applied (Step 6 above)
- Check file size (must be under limit)
- Check file type (must be allowed image type)

### "Policy violation" when accessing files
- Make sure you ran `003_storage_setup.sql` after creating buckets
- Check if you're logged in (for private buckets)
- Verify your user has the correct role (ADMIN for custom orders)

### MIME type restrictions
If you need to allow additional file types later:

1. Go to Storage → Select bucket
2. Click the **Settings** icon (⚙️)
3. Update "Allowed MIME types"
4. Click **"Save"**

---

## ✅ Next Steps

After creating all three buckets and running the SQL:

1. ✅ Buckets are created
2. ✅ Policies are applied
3. ✅ File size limits are set
4. ✅ MIME types are configured
5. ✅ Access control is in place

You can now:
- Upload product images in your app
- Upload user avatars
- Store custom order reference images
- All with proper access control! 🎉

---

## 💡 Pro Tips

### Organizing Files
Use folder structures in your uploads:
```typescript
// Product images
`product-images/product-${productId}/${timestamp}.jpg`

// Custom order images
`custom-order-images/order-${orderId}/${timestamp}.jpg`

// User avatars
`avatars/${userId}/avatar.jpg`
```

### Image Optimization
Before uploading:
- Compress images to reduce size
- Use WebP format for better compression
- Resize images to reasonable dimensions
- Remove EXIF data for privacy

### CDN Benefits
Product images (public bucket) automatically benefit from Supabase's CDN:
- Fast global delivery
- Automatic caching
- Image transformations (resize, crop) available

---

## 📚 Reference

See also:
- `003_storage_setup.sql` - Storage policies SQL
- `src/lib/supabase.ts` - Upload helper functions
- `SUPABASE_SETUP.md` - Complete setup guide
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)

---

*Note: Bucket creation through SQL Editor is restricted for security reasons. This is a Supabase limitation, not a bug in our setup.*

