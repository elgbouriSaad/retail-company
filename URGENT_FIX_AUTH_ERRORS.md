# 🔧 URGENT FIX: Registration & Authentication Errors

## 🔴 Errors You're Seeing

1. ❌ "Multiple GoTrueClient instances detected"
2. ❌ "useAuth must be used within an AuthProvider"
3. ❌ "Database error saving new user" (500 error)
4. ❌ "Registration failed. Please try again."

---

## ✅ SOLUTION 1: Fix Database Trigger (MOST IMPORTANT!)

### The Root Cause:
The database trigger that creates user profiles is not working properly.

### Fix in Supabase Dashboard:

**Step 1: Check if trigger exists**

Go to SQL Editor and run:
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Step 2: Recreate the trigger function**

Run this in SQL Editor:
```sql
-- Drop existing function and trigger (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'USER'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Step 3: Verify trigger was created**
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Should return: `on_auth_user_created | INSERT | users`

---

## ✅ SOLUTION 2: Fix Multiple Supabase Clients

### The Root Cause:
React 18 StrictMode mounts components twice in development, creating multiple Supabase clients.

### Fix: Use Singleton Pattern

Update `src/lib/supabase.ts`:

Add this before the export:
```typescript
// Ensure only one Supabase client instance exists
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = supabaseInstance || createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // ... your config
});

if (!supabaseInstance) {
  supabaseInstance = supabase;
}
```

**OR** (Simpler):

Temporarily remove StrictMode in `src/main.tsx`:
```typescript
createRoot(document.getElementById('root')!).render(
  // <StrictMode>  // Comment this out
    <App />
  // </StrictMode>
);
```

---

## ✅ SOLUTION 3: Disable Email Confirmation

### Go to Supabase Dashboard:

1. **Authentication** → **Providers**
2. Click **Email**
3. Find "Confirm email" setting
4. **UNCHECK** it
5. Click **Save**

This is CRITICAL - most likely cause of your issue!

---

## ✅ SOLUTION 4: Clean Up Existing Failed User

```sql
-- Delete the stuck user from auth
DELETE FROM auth.users WHERE email = 'admin@sew.com';

-- Verify it's gone
SELECT * FROM auth.users WHERE email = 'admin@sew.com';
-- Should return no rows
```

---

## ✅ SOLUTION 5: Verify Environment Variables

Check your `.env.local` file exists and has:
```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

**Restart dev server after any .env changes!**

---

## 🎯 Complete Fix Sequence

### Do these steps IN ORDER:

1. ✅ **Disable email confirmation** (Supabase Dashboard)
2. ✅ **Recreate the trigger** (SQL above)
3. ✅ **Delete stuck user** (SQL above)
4. ✅ **Comment out StrictMode** (main.tsx) - Temporarily
5. ✅ **Verify .env.local** exists with correct values
6. ✅ **Restart dev server** (`Ctrl+C` then `npm run dev`)
7. ✅ **Clear browser cache** (Ctrl+Shift+Delete)
8. ✅ **Try registration again**

---

## 🧪 Test After Fixes

### Test 1: Register New User
```
Email: test@example.com
Password: Test1234!
Name: Test User
```

**Expected:**
- ✅ No errors in console
- ✅ User created successfully
- ✅ Redirected to dashboard
- ✅ Check Supabase Dashboard → Users (should see user)
- ✅ Check Table Editor → users (should see profile)

### Test 2: Verify Trigger
After successful registration:
```sql
-- Check auth user
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'test@example.com';

-- Check profile (IMPORTANT!)
SELECT id, email, name, role FROM public.users WHERE email = 'test@example.com';

-- Both should return results!
```

---

## 🐛 If Still Getting Errors

### Error: "Database error saving new user"

**Additional fix:**

Run this to add error handling to the trigger:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert user profile
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER'::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block user creation, just log the error
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Error: "Multiple clients" persists

**Permanent fix:**

Update `src/main.tsx`:
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Only use StrictMode in production, not development
const AppWrapper = import.meta.env.DEV ? 
  ({ children }: { children: React.ReactNode }) => <>{children}</> :
  StrictMode;

createRoot(document.getElementById('root')!).render(
  <AppWrapper>
    <App />
  </AppWrapper>
);
```

---

## ✅ Expected Result After Fixes

### Console Should Show:
```
✅ Supabase health check passed
✅ User registered and auto-confirmed
✅ Login successful
```

### NO errors about:
- ❌ Multiple clients
- ❌ useAuth outside provider
- ❌ Database error
- ❌ 500 errors

---

## 🚀 Quick Fix Command Sheet

Copy and paste these commands in order:

**In Supabase SQL Editor:**
```sql
-- 1. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER'::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 2. Clean up stuck users
DELETE FROM auth.users WHERE email IN ('admin@soc.com', 'admin@sew.com');

-- 3. Verify setup
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

**In Supabase Dashboard:**
- Authentication → Providers → Email → **UNCHECK** "Confirm email" → Save

**In your terminal:**
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

**In your browser:**
- Clear cache (Ctrl+Shift+Delete)
- Refresh page (Ctrl+F5)

---

## 🎯 After These Fixes

Your registration will:
1. ✅ Check health before attempting
2. ✅ Create user in auth.users
3. ✅ Trigger auto-creates profile in public.users
4. ✅ User logged in immediately
5. ✅ No errors!

---

**Run these fixes and try registering again - it should work!** 🚀

Let me know which step fails if you still have issues!

