# Supabase Environment Variables Template

Copy the content below to your `.env.local` file and fill in your actual Supabase credentials.

```env
# =====================================================
# SUPABASE CONFIGURATION
# =====================================================
# Get these values from your Supabase project dashboard:
# https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api
# =====================================================

# Your Supabase project URL
# Example: https://xyzcompany.supabase.co
VITE_SUPABASE_URL=your_supabase_project_url_here

# Your Supabase anonymous/public key (safe to use in client-side code)
# This is the "anon" public key from your project settings
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# =====================================================
# APPLICATION SETTINGS
# =====================================================

# Application environment
VITE_APP_ENV=development

# Application URL (for CORS and redirects)
VITE_APP_URL=http://localhost:5173

# =====================================================
# STORAGE CONFIGURATION
# =====================================================

# Maximum file upload sizes (in bytes)
VITE_MAX_IMAGE_SIZE=10485760
VITE_MAX_AVATAR_SIZE=5242880

# Allowed image types
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/webp,image/gif
```

## How to Get Your Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **Project URL** and paste it as `VITE_SUPABASE_URL`
5. Copy the **anon public** key and paste it as `VITE_SUPABASE_ANON_KEY`

## Important Notes

- Create a file named `.env.local` in your project root
- The `.env.local` file should be in `.gitignore` (already configured)
- Never commit your actual credentials to version control
- The anon key is safe to expose in client-side code (RLS protects data)
- Restart your development server after creating/updating `.env.local`

