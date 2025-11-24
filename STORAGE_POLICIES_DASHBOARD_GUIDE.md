# Storage Policies Setup via Dashboard UI

## Why Use Dashboard UI for Storage Policies?

Storage policies require special permissions that may not be available in the SQL Editor. The Dashboard UI is the **recommended and easiest way** to create storage policies in Supabase.

---

## 📋 Overview

You'll create **12 policies total**:
- 4 policies for `product-images` bucket
- 4 policies for `custom-order-images` bucket  
- 4 policies for `avatars` bucket

**Time needed:** 15-20 minutes

---

## 🚀 Step-by-Step Instructions

### Access Storage Policies

1. Go to your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click the **Policies** tab at the top
4. You'll see a table called `storage.objects`
5. Click **"New Policy"** button

---

## 📦 Part 1: Product Images Policies (Public Bucket)

### Policy 1: Public Can View Product Images

1. Click **"New Policy"**
2. Choose **"For full customization"** (or skip the template)
3. Fill in:

```
Policy Name: Public can view product images
Allowed operation: SELECT
Policy definition for SELECT:
```

**Target roles:** Check both `anon` and `authenticated` (or select `public`)

**USING expression:**
```sql
bucket_id = 'product-images'
```

4. Click **"Review"** then **"Save policy"**

---

### Policy 2: Admins Can Upload Product Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can upload product images
Allowed operation: INSERT
```

**Target roles:** Check `authenticated`

**WITH CHECK expression:**
```sql
bucket_id = 'product-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 3: Admins Can Update Product Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can update product images
Allowed operation: UPDATE
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'product-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 4: Admins Can Delete Product Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can delete product images
Allowed operation: DELETE
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'product-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

✅ **Product Images Complete!** You should now see 4 policies for product-images.

---

## 🔒 Part 2: Custom Order Images Policies (Private Bucket)

### Policy 5: Admins Can View Custom Order Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can view custom order images
Allowed operation: SELECT
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'custom-order-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 6: Admins Can Upload Custom Order Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can upload custom order images
Allowed operation: INSERT
```

**Target roles:** Check `authenticated`

**WITH CHECK expression:**
```sql
bucket_id = 'custom-order-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 7: Admins Can Update Custom Order Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can update custom order images
Allowed operation: UPDATE
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'custom-order-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 8: Admins Can Delete Custom Order Images

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can delete custom order images
Allowed operation: DELETE
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'custom-order-images' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

✅ **Custom Order Images Complete!** You should now see 4 policies for custom-order-images.

---

## 👤 Part 3: Avatars Policies (Private Bucket)

### Policy 9: Users Can View Own Avatar

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Users can view own avatar
Allowed operation: SELECT
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'avatars' AND
(storage.foldername(name))[1] = auth.uid()::text
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 10: Users Can Upload Own Avatar

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Users can upload own avatar
Allowed operation: INSERT
```

**Target roles:** Check `authenticated`

**WITH CHECK expression:**
```sql
bucket_id = 'avatars' AND
(storage.foldername(name))[1] = auth.uid()::text
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 11: Users Can Update Own Avatar

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Users can update own avatar
Allowed operation: UPDATE
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'avatars' AND
(storage.foldername(name))[1] = auth.uid()::text
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 12: Users Can Delete Own Avatar

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Users can delete own avatar
Allowed operation: DELETE
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'avatars' AND
(storage.foldername(name))[1] = auth.uid()::text
```

3. Click **"Review"** then **"Save policy"**

---

### Policy 13: Admins Can View All Avatars

1. Click **"New Policy"**
2. Fill in:

```
Policy Name: Admins can view all avatars
Allowed operation: SELECT
```

**Target roles:** Check `authenticated`

**USING expression:**
```sql
bucket_id = 'avatars' AND
(SELECT role = 'ADMIN' FROM public.users WHERE id = auth.uid())
```

3. Click **"Review"** then **"Save policy"**

✅ **Avatars Complete!** You should now see 5 policies for avatars.

---

## ✅ Verification Checklist

After creating all policies, verify in the Policies tab:

### Product Images (4 policies)
- [ ] ✅ Public can view product images (SELECT)
- [ ] ✅ Admins can upload product images (INSERT)
- [ ] ✅ Admins can update product images (UPDATE)
- [ ] ✅ Admins can delete product images (DELETE)

### Custom Order Images (4 policies)
- [ ] ✅ Admins can view custom order images (SELECT)
- [ ] ✅ Admins can upload custom order images (INSERT)
- [ ] ✅ Admins can update custom order images (UPDATE)
- [ ] ✅ Admins can delete custom order images (DELETE)

### Avatars (5 policies)
- [ ] ✅ Users can view own avatar (SELECT)
- [ ] ✅ Users can upload own avatar (INSERT)
- [ ] ✅ Users can update own avatar (UPDATE)
- [ ] ✅ Users can delete own avatar (DELETE)
- [ ] ✅ Admins can view all avatars (SELECT)

**Total: 13 policies**

---

## 🧪 Test Your Policies

### Test Product Images (Public)

1. Go to Storage → `product-images`
2. Upload a test image
3. Click on the uploaded image
4. Copy the public URL
5. Open the URL in a new browser tab (incognito mode)
6. ✅ Image should load without login

### Test Avatars (Private - User Only)

1. Log in as a regular user (not admin)
2. In your app, try uploading an avatar
3. File path should be: `avatars/{user-id}/avatar.jpg`
4. ✅ Upload should succeed
5. Try accessing another user's avatar URL
6. ✅ Should be denied (403 error)

### Test Custom Order Images (Admin Only)

1. Log in as admin user
2. Try uploading to `custom-order-images` bucket
3. ✅ Should succeed
4. Log out and try uploading as regular user
5. ✅ Should fail (no permission)

---

## 🐛 Troubleshooting

### "Policy name already exists"
- A policy with that name already exists
- Either delete the old one first or use a different name

### "Invalid SQL expression"
- Double-check for typos in the SQL expressions
- Make sure you're using the correct expression field (USING vs WITH CHECK)
- USING = for SELECT, UPDATE, DELETE
- WITH CHECK = for INSERT

### Policy not working as expected
1. Check the bucket_id is correct (match bucket name exactly)
2. Verify the target role is correct (authenticated for logged-in users)
3. Test with correct file path structure (especially for avatars)
4. Check if user has ADMIN role in users table

### Can't see "New Policy" button
- Make sure you're in the **Policies** tab (not Buckets tab)
- You should see the `storage.objects` table
- If button is disabled, check your project permissions

---

## 📁 File Path Structure

For policies to work correctly, use these path patterns when uploading:

### Product Images
```
product-images/product-{productId}/{timestamp}.jpg
product-images/product-abc123/1699123456789.jpg
```

### Custom Order Images
```
custom-order-images/order-{orderId}/{timestamp}.jpg
custom-order-images/order-xyz789/1699123456789.jpg
```

### Avatars (Important!)
```
avatars/{userId}/avatar.jpg
avatars/550e8400-e29b-41d4-a716-446655440000/avatar.jpg
```

The `{userId}` folder is critical for avatar policies to work!

---

## 💡 Pro Tips

1. **Create policies one at a time** - Test each policy after creating it
2. **Start with SELECT policies** - Make sure you can read before worrying about write
3. **Use descriptive names** - You'll thank yourself later
4. **Copy-paste expressions carefully** - SQL syntax errors are common
5. **Test with different user roles** - Log in as regular user and admin to verify
6. **Check bucket names** - They must match exactly (case-sensitive)

---

## 🎯 What Each Policy Does

### Product Images (Public Bucket)
- **Public read** - Anyone can view product images (good for your shop)
- **Admin write** - Only admins can add/edit/delete products
- This prevents random users from uploading fake products

### Custom Order Images (Private Bucket)
- **Admin only** - Only admins can see and manage custom order photos
- Protects customer privacy
- Keeps order details confidential

### Avatars (Private Bucket)
- **User isolation** - Users can only manage their own avatar
- Uses folder structure: `avatars/{userId}/avatar.jpg`
- Admins can view all avatars (for moderation)
- Prevents users from accessing other users' profile pictures

---

## ✨ Alternative: Simplified Approach

If you want to **get started quickly** and refine permissions later:

### Option A: Allow All Authenticated Users (Temporary)

For now, you can create simple policies that allow all authenticated users:

**For all buckets, create one policy:**
```
Policy Name: Authenticated users can manage files
Operations: SELECT, INSERT, UPDATE, DELETE (check all)
Target roles: authenticated
USING expression: auth.role() = 'authenticated'
WITH CHECK expression: auth.role() = 'authenticated'
```

This gives all logged-in users access to all buckets. **Refine later** with admin-specific policies.

---

## 📚 Additional Resources

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Storage Policies Guide**: https://supabase.com/docs/guides/storage/security/access-control
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Next Steps

Once all policies are created:

1. ✅ Verify all 13 policies exist in Dashboard
2. ✅ Test file uploads in your app
3. ✅ Continue with migration 004 (`004_functions_triggers.sql`)
4. ✅ Create your admin user
5. ✅ Start building your app features!

---

**Storage setup is now complete!** 🎉

You have:
- ✅ 3 storage buckets
- ✅ 13 access control policies
- ✅ Public images for products
- ✅ Private images for orders
- ✅ User-isolated avatars
- ✅ Admin controls

Now you can safely handle file uploads with proper security! 🔒

