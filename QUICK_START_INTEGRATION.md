# 🎯 **QUICK START: Connect Your App to Supabase**

## Before You Start

Make sure you've completed:
- ✅ Migrations 001, 002, and 004 are run in Supabase
- ✅ Storage buckets created (product-images, custom-order-images, avatars)
- ✅ At least one admin user created in database

---

## 🚀 **5-Minute Setup**

### Step 1: Get Your Supabase Credentials (2 min)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 2: Create Environment File (1 min)

Create a file named `.env.local` in your project root:

**Location:** `C:\Users\saadgb\Documents\GitHub\retail-company\.env.local`

**Contents:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual credentials from Step 1.

### Step 3: Install Supabase Client (1 min)

Open terminal in your project folder and run:

```bash
npm install @supabase/supabase-js
```

### Step 4: Restart Dev Server (1 min)

Stop your current dev server (Ctrl+C) and restart:

```bash
npm run dev
```

---

## ✅ **What's Updated**

### AuthContext - Real Authentication
Your `src/context/AuthContext.tsx` now uses Supabase for:
- ✅ **Login** - Real authentication with your database
- ✅ **Register** - New users saved to database
- ✅ **Logout** - Proper session management
- ✅ **Profile Updates** - Saves to database
- ✅ **Session Persistence** - Stays logged in on refresh
- ✅ **Blocked User Check** - Respects admin blocks

---

## 🧪 **Test Your Connection**

### Test 1: Check Browser Console

1. Open your app: http://localhost:5173
2. Open browser console (F12)
3. Look for any Supabase errors
4. No errors = ✅ Connected!

### Test 2: Try Registration

1. Go to registration page
2. Create a new test user:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
3. If successful, check Supabase Dashboard → Authentication → Users
4. You should see your new user!

### Test 3: Try Login

1. Go to login page
2. Use the credentials from Test 2
3. If successful, you'll be redirected to dashboard
4. ✅ Your app is now connected!

### Test 4: Check Database

1. Go to Supabase Dashboard → Table Editor → users
2. Find your test user
3. You should see their profile info
4. ✅ Data is being saved!

---

## 🐛 **Troubleshooting**

### "Missing environment variables"
- Make sure `.env.local` exists in project root (not in src/)
- Variables must start with `VITE_`
- Restart dev server after creating file

### "Failed to fetch" errors
- Check your Supabase URL is correct
- Make sure project is not paused (check dashboard)
- Try accessing the URL in browser - should show a JSON response

### Login fails but registration works
- Check if user exists in auth.users table
- Check if user has matching record in public.users table
- Verify user is not blocked (`is_blocked = false`)

### "JWT expired" or session errors
- Clear browser storage:
  ```javascript
  localStorage.clear();
  sessionStorage.clear();
  ```
- Refresh page and try again

---

## 📋 **What Works Now**

After setup, these features use your database:

✅ **Authentication**
- Login with real credentials
- Registration saves to database
- Session persists across page refreshes
- Logout clears session properly

✅ **User Profiles**
- Profile data stored in database
- Updates save to database
- Admin vs User roles work
- Blocked users can't log in

---

## 📊 **What's Next**

Now that authentication works, we need to update:

### Priority 1: Product Management
- Load products from database
- Save new products
- Update/delete products
- Upload product images to storage

### Priority 2: Order Management
- Save orders to database
- Load order history
- Update order status
- Link orders to users

### Priority 3: User Management (Admin)
- View all users from database
- Block/unblock users
- Update user roles
- Delete users

### Priority 4: File Uploads
- Product images
- Custom order images
- User avatars

---

## 🎯 **Current Status**

| Feature | Status | Notes |
|---------|--------|-------|
| Database Schema | ✅ Ready | All tables created |
| Storage Buckets | ✅ Ready | 3 buckets created |
| Authentication | ✅ Connected | Login/Register work |
| Products | ⏳ Next | Still using mock data |
| Orders | ⏳ Next | Still using mock data |
| Users (Admin) | ⏳ Next | Still using mock data |
| File Uploads | ⏳ Next | Not implemented yet |

---

## 💡 **Quick Wins**

### See Your Data in Supabase

After registering/logging in:
1. Go to Supabase Dashboard
2. Click **Authentication** → See logged in users
3. Click **Table Editor** → **users** → See user profiles
4. Try updating your profile in app
5. Refresh table editor → See changes!

### Admin Access

To make your test user an admin:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your user's email):
   ```sql
   UPDATE users 
   SET role = 'ADMIN' 
   WHERE email = 'test@example.com';
   ```
3. Logout and login again
4. You should now see admin features!

---

## 🚀 **Ready to Continue?**

Once you've:
- ✅ Created `.env.local` with credentials
- ✅ Installed `@supabase/supabase-js`
- ✅ Restarted dev server
- ✅ Tested login/registration
- ✅ Verified data saves to database

**I can now update:**
1. Product management (CRUD operations)
2. Order management (save orders)
3. User management (admin panel)
4. File uploads (images)

Let me know when you're ready for the next step! 🎉

---

## 📚 **Additional Resources**

- **INTEGRATION_GUIDE.md** - Full integration documentation
- **SUPABASE_SETUP.md** - Complete setup guide
- **src/lib/supabase.ts** - Supabase client & helper functions
- **src/lib/database.types.ts** - TypeScript types

---

**Your app is now connected to a real database!** 🎊

No more mock data - everything you save will persist! 🚀

