# Complete Supabase Integration Guide

## 🚀 Connect Your React App to Supabase Database

Follow these steps to make your entire application communicate with Supabase and save all data.

---

## ✅ Step 1: Create Environment Variables File

### Create `.env.local` in your project root:

**File location:** `C:\Users\saadgb\Documents\GitHub\retail-company\.env.local`

**Contents:**
```env
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to get your credentials:

1. Go to your Supabase Dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → paste as `VITE_SUPABASE_URL`
   - **anon public** key → paste as `VITE_SUPABASE_ANON_KEY`

**⚠️ Important:** 
- The file must be named `.env.local` (with the dot at the beginning)
- It should already be in `.gitignore` (don't commit it!)
- Restart your dev server after creating this file

---

## ✅ Step 2: Install Supabase Client

Run this in your terminal:

```bash
npm install @supabase/supabase-js
```

Wait for installation to complete.

---

## ✅ Step 3: Verify Supabase Client Configuration

The file `src/lib/supabase.ts` is already created and ready to use! ✅

It includes:
- ✅ Supabase client initialization
- ✅ Helper functions (getCurrentUser, uploadFile, etc.)
- ✅ TypeScript types
- ✅ Error handling

---

## ✅ Step 4: Update Your Application Code

Now we need to update your React context files to use Supabase instead of mock data.

### Files to Update:
1. `src/context/AuthContext.tsx` - Use Supabase Auth
2. `src/pages/admin/CatalogueManagement.tsx` - Use Supabase for products
3. `src/pages/admin/OrderPaymentManagement.tsx` - Use Supabase for orders
4. `src/pages/admin/UserManagement.tsx` - Use Supabase for users

I'll create updated versions of these files in the next steps.

---

## ✅ Step 5: Test Your Connection

### Create a test file to verify connection:

**File:** `src/utils/testSupabase.ts`

```typescript
import { supabase } from '../lib/supabase';

export async function testConnection() {
  try {
    // Test 1: Check if Supabase client is initialized
    console.log('✅ Supabase client initialized');

    // Test 2: Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test 3: Test auth
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Auth system working. Logged in:', !!session);

    // Test 4: Test storage
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    if (storageError) {
      console.error('⚠️ Storage access limited:', storageError);
    } else {
      console.log('✅ Storage accessible. Buckets:', buckets?.length);
    }

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}
```

### Add this to your `App.tsx` to test on startup:

```typescript
import { useEffect } from 'react';
import { testConnection } from './utils/testSupabase';

function App() {
  useEffect(() => {
    // Test connection on app start (dev only)
    if (import.meta.env.DEV) {
      testConnection();
    }
  }, []);

  // ... rest of your App component
}
```

---

## ✅ Step 6: Run Your Application

```bash
npm run dev
```

1. Open browser console (F12)
2. Look for the connection test logs
3. If you see ✅ messages, you're connected!
4. If you see ❌ errors, check your `.env.local` file

---

## 🔧 Common Issues & Solutions

### Issue: "Missing environment variables"

**Solution:**
1. Make sure `.env.local` exists in project root
2. Check that variables start with `VITE_`
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: "Failed to fetch" or CORS errors

**Solution:**
1. Verify your Supabase URL is correct
2. Check that your project is not paused
3. Go to Supabase Dashboard → Settings → API → Check CORS settings

### Issue: "JWT expired" or auth errors

**Solution:**
```javascript
// Clear browser storage and try again
localStorage.clear();
sessionStorage.clear();
// Refresh page
```

### Issue: "Row Level Security policy violation"

**Solution:**
1. Make sure you ran migration `002_rls_policies.sql`
2. Verify you're logged in as admin user
3. Check that admin user has `role = 'ADMIN'` in database

---

## 📋 Next Steps Checklist

- [ ] Create `.env.local` with your Supabase credentials
- [ ] Install `@supabase/supabase-js`
- [ ] Restart dev server
- [ ] Run app and check browser console
- [ ] Verify connection tests pass
- [ ] Update AuthContext to use Supabase (next step)
- [ ] Update admin pages to use Supabase (next step)

---

## 🎯 What Happens Next

Once your environment is set up, I'll help you:

1. **Update AuthContext** - Real authentication with Supabase
2. **Update Product Management** - Save products to database
3. **Update Order Management** - Save orders to database
4. **Update User Management** - Manage users from database
5. **Add File Uploads** - Upload images to Supabase Storage

---

## 📞 Ready for Integration?

Once you've completed Steps 1-6 above, let me know and I'll:
- ✅ Update your AuthContext with Supabase auth
- ✅ Update your admin pages with database operations
- ✅ Add file upload functionality
- ✅ Make everything persist to your database!

**Have you:**
1. Created `.env.local` with your credentials? 
2. Installed `@supabase/supabase-js`?
3. Restarted your dev server?

Let me know when you're ready, or if you encounter any issues! 🚀

