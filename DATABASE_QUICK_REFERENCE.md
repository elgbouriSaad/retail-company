# Quick Reference: Supabase Database Setup

## 📋 Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Database tables, enums, indexes |
| `supabase/migrations/002_rls_policies.sql` | Row Level Security policies |
| `supabase/migrations/003_storage_setup.sql` | Storage buckets and file policies |
| `supabase/migrations/004_functions_triggers.sql` | Database functions and triggers |
| `src/lib/supabase.ts` | Supabase client configuration |
| `src/lib/database.types.ts` | TypeScript type definitions |
| `SUPABASE_SETUP.md` | Complete setup guide (READ THIS FIRST!) |
| `ENV_TEMPLATE.md` | Environment variables template |

---

## 🚀 Quick Start (5-Minute Setup)

### 1. Create Supabase Project
- Go to https://app.supabase.com
- Click "New Project"
- Save your **Project URL** and **anon key**

### 2. Run Migrations
In Supabase dashboard → SQL Editor, run these files **in order**:
1. ✅ `001_initial_schema.sql`
2. ✅ `002_rls_policies.sql`
3. ✅ `003_storage_setup.sql`
4. ✅ `004_functions_triggers.sql`

### 3. Configure Environment
Create `.env.local` in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 5. Create Admin User
In Supabase dashboard → Authentication → Add user

Then run in SQL Editor:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

### 6. Start Development
```bash
npm run dev
```

**Done! 🎉** Your database is ready.

---

## 📊 Database Tables

### Core Tables
- **users** - User profiles (syncs with Supabase Auth)
- **products** - Product catalog with images
- **orders** - Customer orders
- **order_items** - Order line items
- **custom_orders** - Custom/tailored orders with payment plans

### Supporting Tables
- **contact_messages** - Customer inquiries
- **invoices** - Billing records
- **payments** - Payment transactions
- **settings** - System configuration

### Storage Buckets
- **product-images** (public) - Product photos
- **custom-order-images** (private) - Custom order references
- **avatars** (private) - User profile pictures

---

## 🔐 Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **User Isolation** - Users only see their own data
✅ **Admin Access** - Admins have full access
✅ **File Access Control** - Storage policies protect files
✅ **Authentication** - Supabase Auth integration
✅ **Password Hashing** - Automatic and secure

---

## 🛠️ Key Features

### Automatic Features
- ✅ Auto-updated timestamps (`updated_at`)
- ✅ Auto-calculated order totals
- ✅ Auto-synced user profiles (auth → users table)
- ✅ Auto-updated invoice status based on payments
- ✅ Payment schedule generation for custom orders

### Search & Analytics
- ✅ Full-text product search
- ✅ Order search by customer/ID
- ✅ Sales statistics function
- ✅ Top products report
- ✅ Invoice reference generation

### Data Integrity
- ✅ Foreign key constraints
- ✅ Check constraints (prices ≥ 0, quantity > 0)
- ✅ Unique constraints (email, invoice reference)
- ✅ Cascade deletes where appropriate
- ✅ NOT NULL constraints on required fields

---

## 📝 Common Operations

### Create a Product
```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    name: 'Cotton Fabric',
    description: 'Premium cotton',
    price: 29.99,
    category: 'FABRICS',
    images: ['url1', 'url2'],
    sizes: ['1m', '2m', '5m'],
    stock: 100
  });
```

### Create an Order
```typescript
// 1. Create order
const { data: order } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    total_amount: 0, // Will be auto-calculated
    status: 'PENDING'
  })
  .select()
  .single();

// 2. Add items
const { data: items } = await supabase
  .from('order_items')
  .insert([
    {
      order_id: order.id,
      product_id: 'product-uuid',
      product_name: 'Cotton Fabric',
      quantity: 2,
      size: '2m',
      price: 29.99
    }
  ]);

// Total is automatically calculated!
```

### Upload Image
```typescript
import { uploadFile } from './lib/supabase';

const file = event.target.files[0];
const path = `products/${productId}/${Date.now()}.jpg`;
const url = await uploadFile('product-images', path, file);

// Save URL to database
await supabase
  .from('products')
  .update({ images: [url] })
  .eq('id', productId);
```

### Search Products
```typescript
const { data } = await supabase
  .rpc('search_products', { search_term: 'cotton' });
```

### Get Sales Stats
```typescript
const { data } = await supabase
  .rpc('get_sales_stats', {
    p_start_date: '2024-01-01',
    p_end_date: '2024-12-31'
  });
```

---

## 🎯 Role-Based Access

### USER Role
- ✅ View own profile
- ✅ Update own profile (not role/blocked status)
- ✅ View available products
- ✅ Create orders
- ✅ View own orders
- ✅ Create contact messages
- ✅ Upload own avatar

### ADMIN Role
- ✅ All USER permissions
- ✅ View all users
- ✅ Block/unblock users
- ✅ Manage products (CRUD)
- ✅ View all orders
- ✅ Update order status
- ✅ Manage custom orders
- ✅ Manage invoices & payments
- ✅ View all messages and respond
- ✅ Manage system settings

---

## 🐛 Troubleshooting Quick Fixes

### "JWT expired"
```javascript
localStorage.clear();
// Then login again
```

### "Row level security policy violated"
Check user role:
```sql
SELECT role FROM users WHERE id = auth.uid();
```

### Can't upload files
Check file size (max 10MB for images, 5MB for avatars)

### Order total not calculating
Make sure you're inserting `order_items` AFTER creating the order.

---

## 📚 Full Documentation

For complete setup instructions, see **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

---

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Your SQL Migrations](./supabase/migrations/)
- [Your Client Config](./src/lib/supabase.ts)

---

## 💡 Pro Tips

1. **Always test migrations on staging first**
2. **Use `.select('specific,fields')` for better performance**
3. **Paginate large results** with `.range(start, end)`
4. **Monitor query performance** in Supabase dashboard
5. **Backup your database** before major changes
6. **Keep your anon key safe** (but it's okay to expose it)
7. **NEVER expose service role key** in client code

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 9 tables exist in Table Editor
- [ ] All 3 storage buckets exist in Storage
- [ ] Can create a user via Authentication
- [ ] User appears in `users` table automatically
- [ ] Can log in with created user
- [ ] Admin user has `role = 'ADMIN'`
- [ ] Can create a product as admin
- [ ] Can upload a product image
- [ ] Regular users can't access admin features
- [ ] Environment variables are loaded (check browser console)

---

**Your database is production-ready with scalability, security, and best practices built in!** 🚀

For questions or issues, refer to the [full setup guide](./SUPABASE_SETUP.md) or [troubleshooting section](./SUPABASE_SETUP.md#troubleshooting).

