# Supabase Database Setup Guide

This guide will walk you through setting up your Supabase database for the Retail Company Platform from scratch. Follow these steps carefully to ensure a complete and scalable database implementation.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Supabase Project](#step-1-create-supabase-project)
3. [Step 2: Run Database Migrations](#step-2-run-database-migrations)
4. [Step 3: Configure Storage Buckets](#step-3-configure-storage-buckets)
5. [Step 4: Set Up Authentication](#step-4-set-up-authentication)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Install Required Dependencies](#step-6-install-required-dependencies)
8. [Step 7: Create First Admin User](#step-7-create-first-admin-user)
9. [Step 8: Verify Setup](#step-8-verify-setup)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)
12. [Database Architecture](#database-architecture)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ A Supabase account (sign up at [supabase.com](https://supabase.com))
- ✅ Node.js 18+ installed
- ✅ Git installed
- ✅ Basic understanding of PostgreSQL and SQL
- ✅ Your project cloned locally

---

## Step 1: Create Supabase Project

### 1.1 Create a New Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `retail-company` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is sufficient to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for your project to initialize

### 1.2 Get Your API Credentials

1. Once the project is ready, go to **Settings** > **API**
2. You'll see two important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: A long JWT token starting with `eyJ...`
3. **Keep this tab open** - you'll need these values soon

---

## Step 2: Run Database Migrations

Now we'll set up your database schema by running the SQL migration files.

### 2.1 Navigate to SQL Editor

1. In your Supabase dashboard, go to **SQL Editor** (in the left sidebar)
2. You should see an empty query editor

### 2.2 Run Migration 001 - Initial Schema

1. Open the file `supabase/migrations/001_initial_schema.sql` from your project
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl/Cmd + Enter)
5. You should see: ✅ **"Success. No rows returned"**

**What this does:**
- Creates all database tables (users, products, orders, etc.)
- Sets up enums for status fields
- Creates indexes for performance
- Adds data validation constraints

### 2.3 Run Migration 002 - Row Level Security

1. Open `supabase/migrations/002_rls_policies.sql`
2. Copy and paste the entire file into SQL Editor
3. Click **"Run"**
4. ✅ Success!

**What this does:**
- Enables Row Level Security (RLS) on all tables
- Creates policies so users can only access their own data
- Admins get full access to all data
- Protects your data at the database level

### 2.4 Create Storage Buckets (Manual Step)

⚠️ **IMPORTANT: Buckets must be created manually first!**

Storage buckets cannot be created via SQL in Supabase. Follow these steps:

1. Go to **Storage** section in your Supabase dashboard (left sidebar)
2. Click **"New Bucket"** to create these **3 buckets**:

#### Bucket 1: product-images (Public)
- Name: `product-images`
- Public: ✅ **YES** (check this box)
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

#### Bucket 2: custom-order-images (Private)
- Name: `custom-order-images`
- Public: ❌ **NO** (uncheck this box)
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

#### Bucket 3: avatars (Private)
- Name: `avatars`
- Public: ❌ **NO** (uncheck this box)
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`

📖 **Need help?** See `STORAGE_BUCKETS_GUIDE.md` for detailed step-by-step instructions.

✅ Verify all 3 buckets are created before continuing!

### 2.5 Run Migration 003 - Storage Policies

Now apply the storage access policies:

1. Open `supabase/migrations/003_storage_setup.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**
4. ✅ Success!

**What this does:**
- Sets up access control policies for files
- Configures who can upload/view/delete files
- Protects private buckets with authentication

### 2.6 Run Migration 004 - Functions & Triggers

1. Open `supabase/migrations/004_functions_triggers.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**
4. ✅ Success!

**What this does:**
- Creates automatic timestamp updates
- Syncs auth users with profile table
- Auto-calculates order totals
- Sets up payment schedule generation
- Creates search and analytics functions

### 2.6 Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see all these tables:
   - ✅ users
   - ✅ products
   - ✅ orders
   - ✅ order_items
   - ✅ custom_orders
   - ✅ contact_messages
   - ✅ settings
   - ✅ invoices
   - ✅ payments

If you see all tables, **congratulations!** 🎉 Your database schema is ready.

---

## Step 3: Configure Storage Buckets

### 3.1 Verify Storage Buckets

1. Go to **Storage** in the left sidebar
2. You should see three buckets:
   - ✅ `product-images` (public)
   - ✅ `custom-order-images` (private)
   - ✅ `avatars` (private)

### 3.2 Configure Bucket Settings (Optional)

For each bucket, you can:
- Adjust file size limits
- Add additional allowed MIME types
- Configure image transformations

The default settings are already optimized for production use.

---

## Step 4: Set Up Authentication

### 4.1 Configure Email Auth

1. Go to **Authentication** > **Providers**
2. **Email** should already be enabled (it's on by default)
3. Scroll down to **Email Templates** and customize if needed:
   - Confirmation email
   - Reset password email
   - Magic link email

### 4.2 Configure Auth Settings

1. Go to **Authentication** > **Settings**
2. Recommended settings:
   - ✅ **Enable email confirmations**: ON (for production)
   - ✅ **Minimum password length**: 8 characters
   - ✅ **Enable Secure Password**: ON
   - ✅ **Session timeout**: 3600 seconds (1 hour)

### 4.3 Set Up Email Provider (Production)

For production, configure a custom SMTP provider:

1. Go to **Authentication** > **Settings** > **SMTP Settings**
2. Configure your email provider (SendGrid, Mailgun, etc.)
3. For development, you can use the default Supabase emails

---

## Step 5: Configure Environment Variables

### 5.1 Create .env.local File

1. In your project root, create a file named `.env.local`
2. Copy the template from `ENV_TEMPLATE.md`
3. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.2 Add Additional Settings

```env
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_MAX_IMAGE_SIZE=10485760
VITE_MAX_AVATAR_SIZE=5242880
```

### 5.3 Verify Environment Variables

Make sure `.env.local` is in your `.gitignore` file (it should be by default).

**⚠️ Never commit `.env.local` to version control!**

---

## Step 6: Install Required Dependencies

### 6.1 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 6.2 Verify Installation

Check your `package.json` - you should see:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x"
  }
}
```

### 6.3 Restart Development Server

```bash
npm run dev
```

The application should now connect to your Supabase database!

---

## Step 7: Create First Admin User

You need at least one admin user to manage the platform.

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Fill in:
   - **Email**: your admin email
   - **Password**: a strong password
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create user"**
5. Copy the user's UUID (you'll need it next)

### 7.1 Set Admin Role

1. Go to **SQL Editor**
2. Run this query (replace `YOUR_USER_ID` with the UUID from above):

```sql
UPDATE users
SET role = 'ADMIN'
WHERE id = 'YOUR_USER_ID';
```

3. ✅ Success! You now have an admin user.

### Method 2: Using the Application

1. Start your development server: `npm run dev`
2. Go to the registration page
3. Create a new account
4. Go to Supabase dashboard > **Table Editor** > **users**
5. Find your user and change `role` from `USER` to `ADMIN`

---

## Step 8: Verify Setup

### 8.1 Test Database Connection

1. Start your app: `npm run dev`
2. Open browser console (F12)
3. You should NOT see any Supabase connection errors

### 8.2 Test Authentication

1. Go to the login page
2. Log in with your admin credentials
3. You should be redirected to the dashboard
4. ✅ Success!

### 8.3 Test Data Operations

Try these operations:

#### Test Products
1. Go to **Catalogue Management** (admin panel)
2. Try creating a test product
3. Upload a product image
4. Verify it appears in the products list

#### Test Storage
1. Upload an avatar in your profile
2. Go to Supabase dashboard > **Storage** > **avatars**
3. You should see your uploaded file

#### Test RLS (Security)
1. Log out and create a regular user account
2. Regular users should NOT see admin-only sections
3. Users should only see their own orders

---

## Troubleshooting

### Issue: "No rows returned" for users table

**Solution:**
The `users` table is automatically populated when someone signs up via Supabase Auth. The trigger `handle_new_user()` syncs auth.users → public.users.

Test by creating a user through your app's registration form.

### Issue: "JWT expired" error

**Solution:**
```javascript
// Clear your browser's localStorage
localStorage.clear();
// Then refresh and log in again
```

### Issue: Storage upload fails

**Possible causes:**
1. File is too large (check limits)
2. Wrong file type (only images allowed)
3. User doesn't have permission (check RLS policies)

**Check bucket policies:**
```sql
-- View storage policies
SELECT * FROM storage.policies;
```

### Issue: RLS blocks admin access

**Solution:**
Make sure your user has `role = 'ADMIN'` in the users table:

```sql
SELECT id, email, role FROM users;
```

### Issue: Foreign key constraint errors

**Solution:**
Make sure you're creating related records in the correct order:
1. Create user first
2. Then create orders for that user
3. Then create order items for that order

---

## Best Practices

### 1. Security

- ✅ Always use RLS policies (never disable them)
- ✅ Use the anon key in client code (not service role key)
- ✅ Validate user input on both client and server
- ✅ Use prepared statements (Supabase does this automatically)
- ✅ Enable email confirmation in production
- ✅ Use strong passwords (8+ chars, mixed case, numbers, symbols)

### 2. Performance

- ✅ Use indexes on frequently queried columns (already created)
- ✅ Paginate large result sets using `.range(start, end)`
- ✅ Use `.select('specific,columns')` instead of `.select('*')`
- ✅ Enable Supabase's built-in caching for static data
- ✅ Use connection pooling (enabled by default)

### 3. Data Management

- ✅ Backup your database regularly
- ✅ Test migrations on staging before production
- ✅ Use transactions for multi-step operations
- ✅ Soft delete important records (add `deleted_at` column)
- ✅ Keep audit logs for sensitive operations

### 4. Storage

- ✅ Organize files in folders: `bucket/user-id/filename`
- ✅ Generate unique filenames: `avatar-${timestamp}.jpg`
- ✅ Compress images before upload
- ✅ Use Supabase's image transformation CDN
- ✅ Delete old files when uploading new ones

### 5. Monitoring

- ✅ Monitor query performance in Supabase dashboard
- ✅ Set up alerts for errors and slow queries
- ✅ Check storage usage regularly
- ✅ Monitor authentication patterns
- ✅ Review logs for security issues

---

## Database Architecture

### Entity Relationship Overview

```
users (auth)
  ├── orders (1:many)
  │   └── order_items (1:many)
  │       └── products (many:1)
  ├── contact_messages (1:many)
  └── invoices (via client_id)

products (catalog)
  ├── order_items (1:many)
  └── contact_messages (1:many)

custom_orders (standalone)
  └── payment_schedule (embedded JSON)

invoices
  └── payments (1:many)

settings (key-value store)
```

### Table Purposes

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles & auth | Syncs with auth.users, role-based access |
| `products` | Product catalog | JSONB for images/sizes, full-text search |
| `orders` | Standard orders | Auto-calculates total from items |
| `order_items` | Order line items | Snapshot pricing at order time |
| `custom_orders` | Tailored orders | Payment schedules, reference materials |
| `contact_messages` | Customer support | Can link to products, admin responses |
| `settings` | Config storage | Key-value pairs for system settings |
| `invoices` | Billing records | Auto-updates status based on payments |
| `payments` | Payment records | Links to invoices, multiple methods |

### Data Flow Examples

#### Creating an Order
```typescript
1. User adds products to cart (client-side)
2. User clicks "Checkout"
3. Create order record → orders table
4. Create order_items for each product → order_items table
5. Trigger auto-calculates total_amount
6. Order confirmation sent to user
```

#### Processing a Payment
```typescript
1. Admin creates/selects invoice
2. Admin records payment → payments table
3. Trigger auto-updates invoice.amount_paid
4. Trigger auto-updates invoice.status
5. System sends payment receipt
```

#### File Upload Flow
```typescript
1. User selects file (max 10MB for products)
2. Client validates file type/size
3. Upload to storage bucket via supabase.storage
4. Get public/signed URL
5. Save URL in database (products.images, etc.)
6. Display image using URL
```

---

## Advanced Configuration

### Enable Realtime (Optional)

If you want live updates when data changes:

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

Then in your React code:

```typescript
// Subscribe to product changes
const subscription = supabase
  .channel('products-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      console.log('Product changed:', payload);
      // Update your UI
    }
  )
  .subscribe();
```

### Database Backups

**Automatic Backups** (included with paid plans):
- Daily backups retained for 7 days
- Point-in-time recovery available

**Manual Backups**:
1. Go to **Database** > **Backups**
2. Click **"Create backup"**
3. Download and store securely

### Connection Pooling

Supabase automatically configures connection pooling. For custom configs:

1. Go to **Settings** > **Database**
2. Adjust **Max Connections** (default: 100)
3. Adjust **Statement Timeout** (default: 8s)

---

## Migration to Production

When you're ready to deploy:

### 1. Create Production Project

1. Create a new Supabase project for production
2. Run all migrations on the new project
3. Configure production environment variables

### 2. Update Environment Variables

```env
# Production .env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_APP_ENV=production
VITE_APP_URL=https://yourdomain.com
```

### 3. Security Checklist

- ✅ Enable email confirmation
- ✅ Configure custom SMTP
- ✅ Set up custom domain for emails
- ✅ Review and test all RLS policies
- ✅ Enable MFA for admin accounts
- ✅ Set up monitoring and alerts
- ✅ Configure rate limiting
- ✅ Review API logs regularly

### 4. Performance Optimization

- ✅ Enable caching for static data
- ✅ Use CDN for storage assets
- ✅ Optimize database queries
- ✅ Add database indexes as needed
- ✅ Consider read replicas for high traffic

---

## Support & Resources

### Official Documentation
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PostgREST API](https://postgrest.org/)

### Community
- [Supabase Discord](https://discord.supabase.com/)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### Your Project Files
- `supabase/migrations/` - All SQL migrations
- `src/lib/supabase.ts` - Client configuration
- `src/lib/database.types.ts` - TypeScript types
- `ENV_TEMPLATE.md` - Environment variables reference

---

## Conclusion

You now have a fully functional, scalable database for your Retail Company Platform! 🎉

Your database includes:
- ✅ Complete schema with 9 tables
- ✅ Row Level Security for data protection
- ✅ File storage with access control
- ✅ Automatic triggers and functions
- ✅ Full-text search capabilities
- ✅ Analytics and reporting functions
- ✅ Type-safe TypeScript integration

### Next Steps

1. **Start building your features** - Your database is ready!
2. **Test thoroughly** - Try all CRUD operations
3. **Add sample data** - Populate products and test orders
4. **Customize as needed** - Add fields or tables specific to your business
5. **Deploy to production** - When ready, follow the production migration guide

### Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review Supabase logs in the dashboard
3. Check browser console for errors
4. Refer to the official Supabase documentation

Happy coding! 🚀

