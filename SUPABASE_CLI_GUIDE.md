# Supabase CLI Setup Guide

## 🚀 Connect to Supabase from Terminal

This guide shows you how to install and use the Supabase CLI to manage your project from the command line.

---

## 📦 Step 1: Install Supabase CLI

### Windows (Using npm - Recommended)

```bash
npm install -g supabase
```

### Windows (Using Chocolatey)

```bash
choco install supabase
```

### Windows (Using Scoop)

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation

```bash
supabase --version
```

You should see something like: `1.x.x`

---

## 🔐 Step 2: Login to Supabase

### Login with Access Token (Recommended)

1. **Get your access token:**
   - Go to https://app.supabase.com/account/tokens
   - Click "Generate new token"
   - Give it a name like "CLI Access"
   - Copy the token (save it somewhere safe!)

2. **Login via terminal:**

```bash
supabase login
```

3. **Paste your access token** when prompted

4. **Verify login:**

```bash
supabase projects list
```

You should see your projects listed!

---

## 🔗 Step 3: Link to Your Project

### Get Your Project Reference ID

1. Go to your Supabase project dashboard
2. Go to **Settings** > **General**
3. Copy your **Project ID** or **Reference ID**

### Link Your Local Project

In your project directory:

```bash
cd C:\Users\saadgb\Documents\GitHub\retail-company

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID
```

When prompted, enter your **database password** (the one you created when setting up the project).

---

## ✅ Step 4: Verify Connection

Test that everything is connected:

```bash
# Check project status
supabase status

# List all functions
supabase functions list

# Check database connection
supabase db remote list
```

---

## 🎯 Common Supabase CLI Commands

### Database Migrations

```bash
# Push local migrations to remote database
supabase db push

# Pull remote changes to local
supabase db pull

# Reset remote database (CAREFUL!)
supabase db reset --db-url YOUR_DB_URL

# Run a specific migration file
supabase db execute --file ./supabase/migrations/001_initial_schema.sql
```

### Generate TypeScript Types

```bash
# Generate types from your database
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

# Or if linked:
supabase gen types typescript --linked > src/lib/database.types.ts
```

### Project Management

```bash
# List all your projects
supabase projects list

# Get project details
supabase projects info

# Open project in browser
supabase projects open
```

### Storage

```bash
# List storage buckets
supabase storage list

# Upload a file
supabase storage upload bucket-name path/to/file.jpg

# Download a file
supabase storage download bucket-name path/to/file.jpg
```

### Functions

```bash
# List edge functions
supabase functions list

# Deploy a function
supabase functions deploy function-name

# View function logs
supabase functions logs function-name
```

---

## 🛠️ Alternative: Run Migrations from CLI

Instead of copy-pasting SQL in the dashboard, you can run migrations from terminal:

### Option 1: Run SQL File Directly

```bash
# Run your migration files
supabase db execute --file ./supabase/migrations/001_initial_schema.sql --db-url postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

supabase db execute --file ./supabase/migrations/002_rls_policies.sql --db-url postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

supabase db execute --file ./supabase/migrations/004_functions_triggers.sql --db-url postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Option 2: Use psql (PostgreSQL CLI)

```bash
# Get your connection string from Supabase Dashboard
# Settings > Database > Connection string (Direct connection)

psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Then run:
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_rls_policies.sql
\i supabase/migrations/004_functions_triggers.sql
```

---

## 📋 Quick Reference: Your Project Setup

### 1. Login to Supabase

```bash
supabase login
```

### 2. Link Your Project

```bash
cd C:\Users\saadgb\Documents\GitHub\retail-company
supabase link --project-ref YOUR_PROJECT_ID
```

### 3. Generate Types (Optional)

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

### 4. Run Migrations

```bash
# Get your database URL
supabase projects list --format=json

# Run each migration
supabase db execute --file ./supabase/migrations/001_initial_schema.sql
supabase db execute --file ./supabase/migrations/002_rls_policies.sql
supabase db execute --file ./supabase/migrations/004_functions_triggers.sql
```

---

## 🔑 Get Your Database Connection String

### From Supabase Dashboard

1. Go to **Settings** > **Database**
2. Under **Connection string**, select:
   - **URI** for connection string
   - **Connection pooling** for production
3. Copy and replace `[YOUR-PASSWORD]` with your actual password

### Direct Connection String Format

```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Example

```
postgresql://postgres:MySecurePassword123@db.abc123xyz.supabase.co:5432/postgres
```

---

## 🐛 Troubleshooting

### "supabase: command not found"

**Solution:**
```bash
# Reinstall via npm
npm install -g supabase

# Or add to PATH (Windows)
# npm bin -g will show you where npm installs global packages
```

### "Failed to connect to database"

**Possible causes:**
1. Wrong password
2. Wrong project reference ID
3. Firewall blocking connection

**Solution:**
```bash
# Test connection with psql first
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# If that works, the CLI should work too
```

### "Permission denied"

**Solution:**
```bash
# Make sure you're logged in
supabase login

# Check your access token is valid
supabase projects list
```

### "Project not linked"

**Solution:**
```bash
# Link your project first
supabase link --project-ref YOUR_PROJECT_ID

# Verify link
supabase status
```

---

## 💡 Pro Tips

### 1. Store Connection String in .env

Create a `.env` file (add to `.gitignore`):

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Create npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --linked > src/lib/database.types.ts",
    "db:push": "supabase db push",
    "db:pull": "supabase db pull",
    "db:reset": "supabase db reset"
  }
}
```

Then run:
```bash
npm run db:types
```

### 3. Auto-generate Types After Schema Changes

```bash
# After making database changes, regenerate types
supabase gen types typescript --linked > src/lib/database.types.ts
```

### 4. Use Connection Pooler for Production

For better performance, use the pooled connection:

```
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 🎯 What You Can Do Now

With Supabase CLI connected, you can:

✅ Run migrations from terminal (faster than copy-paste)
✅ Generate TypeScript types automatically
✅ Manage storage buckets
✅ Deploy edge functions
✅ View logs and analytics
✅ Backup and restore databases
✅ Seed data from SQL files
✅ Run tests against your database

---

## 📚 Useful Commands Cheat Sheet

```bash
# Authentication
supabase login                          # Login with access token
supabase logout                         # Logout

# Project Management
supabase projects list                  # List all projects
supabase link --project-ref ID          # Link to project
supabase status                         # Check connection status

# Database
supabase db execute --file file.sql    # Run SQL file
supabase db reset                       # Reset database
supabase db push                        # Push local changes
supabase db pull                        # Pull remote changes

# Types
supabase gen types typescript --linked  # Generate types

# Storage
supabase storage list                   # List buckets
supabase storage upload bucket file     # Upload file

# Functions
supabase functions list                 # List functions
supabase functions deploy name          # Deploy function

# Secrets
supabase secrets list                   # List secrets
supabase secrets set KEY=value          # Set secret
```

---

## 🔗 Additional Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **CLI GitHub**: https://github.com/supabase/cli
- **CLI Reference**: https://supabase.com/docs/reference/cli

---

## ✅ Next Steps

1. ✅ Install Supabase CLI
2. ✅ Login with your access token
3. ✅ Link to your project
4. ✅ Run migrations from terminal (optional)
5. ✅ Generate TypeScript types
6. ✅ Continue building your app!

---

**You're now connected to Supabase from your terminal!** 🎉

You can manage your entire database, storage, and functions without leaving your IDE.

