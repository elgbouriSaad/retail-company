# Email and Password Update Flow

## Overview

This document explains how SmartDoc successfully handles email and password updates for users and admins, ensuring that changes are synchronized between the **public database** (`public.users` table) and the **authentication system** (`auth.users` table).

## Architecture

### Why We Need Edge Functions

Supabase has two separate systems:
- **Public Database**: `public.users` table containing user profile information
- **Auth System**: `auth.users` table managed by Supabase Auth for authentication

The frontend application uses the **ANON_KEY** (anonymous key) which has limited permissions and **cannot directly modify** `auth.users`. To update authentication data (email/password), we must use:
- **SERVICE_ROLE_KEY**: Has admin privileges to modify `auth.users`
- **Edge Functions**: Server-side functions that run with SERVICE_ROLE_KEY permissions

### Key Edge Functions

We use two main Edge Functions for user management:

1. **`user-management`**: Main function for creating, updating, and deleting users
2. **`admin-reset-password`**: Specialized function for admins to reset user passwords

---

## Update Flow Architecture

```
┌─────────────────┐
│   Frontend      │
│  (ANON_KEY)     │
└────────┬────────┘
         │
         │ HTTP Request
         │ (with Auth Token)
         │
         ▼
┌─────────────────────────┐
│   Edge Function         │
│  (SERVICE_ROLE_KEY)     │
│                         │
│  ┌─────────────────┐    │
│  │ 1. Verify Auth  │    │
│  │ 2. Check Perms  │    │
│  │ 3. Validate     │    │
│  └─────────────────┘    │
└───────┬─────────────────┘
        │
        ├──────────────────┐
        │                  │
        ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ public.users │   │ auth.users   │
│              │   │              │
│ • email      │   │ • email      │
│ • first_name │   │ • password   │
│ • last_name  │   │ • metadata   │
│ • role       │   │ • confirmed  │
└──────────────┘   └──────────────┘
```

---

## Edge Function: `user-management`

Location: `supabase/functions/user-management/index.ts`

This function handles multiple operations via different HTTP methods:

### Supported Methods

| Method | Purpose | Who Can Use |
|--------|---------|-------------|
| `POST` | Create new user | Admins, Doctors |
| `PUT` | Update existing user (full update) | Admins, Doctors |
| `PATCH` | Update user (partial update) | Admins, Doctors |
| `DELETE` | Delete user | Admins, Doctors |
| `GET` | Get user(s) | Admins, Doctors |

### Permission Model

```typescript
// Check if the current user is an admin or doctor
const isAdmin = userData?.role === 'admin';
const isDoctor = userData?.role === 'doctor';

if (!isAdmin && !isDoctor) {
  return error('Only administrators and doctors can manage users');
}

// Doctors can only manage their own assistants
if (isDoctor && !isAdmin) {
  // Verify the user being updated is assigned to this doctor
  const relationship = await checkDoctorAssistantRelationship(doctorId, userId);
  if (!relationship) {
    return error('You can only manage your own assistants');
  }
}
```

### PUT Method - Full User Update

Used for comprehensive user updates including email and password.

**Request Format:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "assistant",
  "password": "newpassword123" // Optional
}
```

**Update Process:**

1. **Validate Input**
   ```typescript
   if (!userId || !email || !firstName || !lastName || !role) {
     throw new Error('Missing required fields');
   }
   ```

2. **Check Email Uniqueness**
   ```typescript
   const { data: existingUser } = await supabase
     .from('users')
     .select('id')
     .eq('email', email)
     .neq('id', userId)  // Exclude current user
     .maybeSingle();
   
   if (existingUser) {
     throw new Error('Email is already in use by another user');
   }
   ```

3. **Update `public.users`**
   ```typescript
   const { error: updateError } = await supabase
     .from('users')
     .update({
       first_name: firstName,
       last_name: lastName,
       role: role,
       email: email,
       updated_at: new Date().toISOString()
     })
     .eq('id', userId);
   ```

4. **Update `auth.users`**
   ```typescript
   const updateData = {
     email: email,
     email_confirm: true,  // ⭐ Skip email verification
     user_metadata: {
       full_name: `${firstName} ${lastName}`,
       role: role
     }
   };
   
   if (password) {
     updateData.password = password;  // Update password if provided
   }
   
   const { error } = await supabase.auth.admin.updateUserById(
     userId,
     updateData
   );
   ```

5. **Return Success**
   ```json
   {
     "success": true,
     "message": "User updated successfully"
   }
   ```

### PATCH Method - Partial User Update

Used for targeted updates (e.g., just email or just password).

**Request Format:**
```json
{
  "userId": "uuid",
  "email": "newemail@example.com",  // Optional
  "password": "newpassword",        // Optional
  "firstName": "John",              // Optional
  "lastName": "Doe"                 // Optional
}
```

**Key Differences from PUT:**
- Only updates fields that are provided
- More flexible for partial updates
- Same permission checks apply

**Update Process:**

1. **Build Update Object Dynamically**
   ```typescript
   const updateData = { updated_at: new Date().toISOString() };
   
   if (firstName) updateData.first_name = firstName;
   if (lastName) updateData.last_name = lastName;
   if (email) updateData.email = email;
   if (role) updateData.role = role;
   ```

2. **Update `public.users`**
   ```typescript
   await supabase
     .from('users')
     .update(updateData)
     .eq('id', userId);
   ```

3. **Update `auth.users` (if email or password changed)**
   ```typescript
   const authUpdateData = {};
   
   if (email) {
     authUpdateData.email = email;
     authUpdateData.email_confirm = true;
   }
   if (password) {
     authUpdateData.password = password;
   }
   
   if (Object.keys(authUpdateData).length > 0) {
     await supabase.auth.admin.updateUserById(userId, authUpdateData);
   }
   ```

---

## Edge Function: `admin-reset-password`

Location: `supabase/functions/admin-reset-password/index.ts`

This specialized function allows admins to reset any user's password.

**Request Format:**
```json
{
  "email": "user@example.com",
  "newPassword": "password123"  // Defaults to "password123" if not provided
}
```

**Update Process:**

1. **Verify Admin Authorization**
   ```typescript
   const { data: userProfile } = await supabaseAdmin
     .from('users')
     .select('role, first_name, last_name')
     .eq('id', currentUserId)
     .single();
   
   if (userProfile.role !== 'admin') {
     throw new Error('Only admins can reset passwords');
   }
   ```

2. **Find Target User**
   ```typescript
   const { data: targetUser } = await supabaseAdmin
     .from('users')
     .select('id, email, first_name, last_name')
     .eq('email', email.toLowerCase())
     .single();
   ```

3. **Check if Auth User Exists**
   ```typescript
   const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
   const existingAuthUser = authUsers.users.find(u => u.email === targetUser.email);
   ```

4. **Update or Create Auth User**
   
   **If auth user exists:**
   ```typescript
   await supabaseAdmin.auth.admin.updateUserById(
     existingAuthUser.id,
     {
       password: newPassword,
       email_confirm: true
     }
   );
   ```
   
   **If auth user doesn't exist:**
   ```typescript
   const { data: createResult } = await supabaseAdmin.auth.admin.createUser({
     email: targetUser.email.toLowerCase(),
     password: newPassword,
     email_confirm: true,
     user_metadata: {
       first_name: targetUser.first_name,
       last_name: targetUser.last_name
     }
   });
   
   // Sync user ID between auth.users and public.users
   await supabaseAdmin
     .from('users')
     .update({ id: createResult.user.id })
     .eq('email', targetUser.email.toLowerCase());
   ```

5. **Return Success with Credentials**
   ```json
   {
     "success": true,
     "message": "Password reset successfully",
     "email": "user@example.com",
     "newPassword": "password123",
     "note": "User can now login immediately with: user@example.com / password123"
   }
   ```

---

## Frontend Implementation

### Component: `AssistantManagement.tsx`

Location: `src/components/Settings/AssistantManagement.tsx`

**Smart Detection of Auth Updates:**

```typescript
const handleEditSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Detect if email or password is changing
  const needsAuthUpdate = 
    formData.password || 
    (formData.email.trim() !== selectedUser.email);
  
  if (needsAuthUpdate) {
    // Use Edge Function for auth-related updates
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management`;
    const response = await fetch(functionUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: selectedUser.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password || undefined
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user via Edge Function');
    }
  } else {
    // Direct update for non-auth fields
    await supabase
      .from('users')
      .update({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedUser.id);
  }
};
```

### Service: `userService.updateWithAuth()`

Location: `src/services/users.ts`

This service method provides a reusable way to update users with auth sync:

```typescript
async updateWithAuth(id: string, updates: Partial<User> & { password?: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Use Edge Function for auth updates
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: id,
        firstName: updates.first_name,
        lastName: updates.last_name,
        email: updates.email,
        password: updates.password,
        role: updates.role
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Update failed');
  }

  return await response.json();
}
```

---

## Email Confirmation Strategy

### Immediate Confirmation

We use `email_confirm: true` to skip email verification:

```typescript
const updateData = {
  email: newEmail,
  email_confirm: true  // ⭐ User can login immediately
};
```

**Why?**
- **Internal System**: This is a medical practice management system, not a public-facing application
- **Admin-Controlled**: Email updates are performed by admins or doctors, not by end users
- **Immediate Access**: Users need immediate access after email change
- **No Email Service**: Avoids dependency on email delivery services

**Security Considerations:**
- Only admins and doctors can update user emails
- Doctors can only update their own assistants
- All changes are logged in the database
- Requires valid authentication token

---

## Update Scenarios

### Scenario 1: Admin Updates User Email

**Steps:**
1. Admin navigates to User Management page
2. Selects user and clicks "Edit"
3. Changes email from `old@example.com` to `new@example.com`
4. Clicks "Save"

**Backend Flow:**
```
Frontend (PATCH) 
  → user-management Edge Function
    → Verify admin role ✓
    → Update public.users.email
    → Update auth.users.email (confirmed)
    → Return success
```

**Result:**
- ✅ User record updated in `public.users`
- ✅ Auth record updated in `auth.users`
- ✅ Email confirmed automatically
- ✅ User can login immediately with new email

### Scenario 2: Admin Resets User Password

**Steps:**
1. Admin navigates to User Management
2. Clicks "Reset Password" on user
3. Enters new password (or uses default)
4. Confirms

**Backend Flow:**
```
Frontend (POST)
  → admin-reset-password Edge Function
    → Verify admin role ✓
    → Find user by email
    → Update auth.users.password
    → Return success with new credentials
```

**Result:**
- ✅ Password updated in `auth.users`
- ✅ User can login immediately with new password
- ✅ Admin receives confirmation with new credentials

### Scenario 3: Doctor Updates Assistant Email

**Steps:**
1. Doctor navigates to Settings → Assistant Management
2. Selects assistant and clicks "Edit"
3. Changes email
4. Clicks "Save"

**Backend Flow:**
```
Frontend (PATCH)
  → user-management Edge Function
    → Verify doctor role ✓
    → Verify assistant belongs to doctor ✓
    → Update public.users.email
    → Update auth.users.email (confirmed)
    → Return success
```

**Result:**
- ✅ Assistant record updated
- ✅ Auth record updated
- ✅ Doctor sees success message
- ✅ Assistant can login with new email

### Scenario 4: User Changes Own Password

**Steps:**
1. User navigates to Profile Settings
2. Enters current password
3. Enters new password
4. Clicks "Change Password"

**Backend Flow:**
```
Frontend
  → userService.changeOwnPassword()
    → Verify current password
    → Update password via supabase.auth.updateUser()
    → Return success
```

**Note:** This uses the client-side auth method because:
- User is updating their own password
- Current password verification required
- No Edge Function needed for self-updates

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Email is already in use by another user` | Duplicate email detected | Edge Function checks email uniqueness before updating |
| `Only admins can reset passwords` | Unauthorized password reset attempt | Verify user role in Edge Function |
| `You can only manage your own assistants` | Doctor trying to update non-assigned user | Check doctor-assistant relationship |
| `Error updating auth user` | Supabase Auth API error | Log error details, rollback if needed |
| `Missing required fields` | Incomplete request data | Validate all required fields before submission |

### Transaction Safety

While true database transactions aren't available across `public` and `auth` schemas, we use this safety pattern:

```typescript
// 1. Update public.users first
const { error: publicError } = await supabase
  .from('users')
  .update(userData)
  .eq('id', userId);

if (publicError) {
  throw new Error(`Public update failed: ${publicError.message}`);
}

// 2. Then update auth.users
const { error: authError } = await supabase.auth.admin.updateUserById(
  userId,
  authData
);

if (authError) {
  console.error('❌ Auth update failed after public update');
  throw new Error(`Auth update failed: ${authError.message}`);
}
```

**Why this order?**
- `public.users` update is more likely to fail (constraints, validators)
- If `public` update fails, no changes are made
- If `auth` update fails, we log the error and alert admins
- Manual reconciliation needed in rare auth update failures

---

## Security Features

### Authentication & Authorization

1. **Token Verification**
   ```typescript
   const authHeader = req.headers.get('Authorization');
   const token = authHeader.replace('Bearer ', '');
   const { data: { user } } = await supabase.auth.getUser(token);
   ```

2. **Role-Based Access Control**
   ```typescript
   const { data: userData } = await supabase
     .from('users')
     .select('role')
     .eq('id', user.id)
     .single();
   
   const isAdmin = userData?.role === 'admin';
   const isDoctor = userData?.role === 'doctor';
   ```

3. **Resource Ownership Verification**
   ```typescript
   if (isDoctor && !isAdmin) {
     const { data: relationship } = await supabase
       .from('doctor_assistants')
       .select('assistant_id')
       .eq('doctor_id', currentUser.id)
       .eq('assistant_id', userId)
       .single();
     
     if (!relationship) {
       throw new Error('Unauthorized');
     }
   }
   ```

### Input Validation

```typescript
function validateUserInput(data) {
  const { email, password, firstName, lastName, role } = data;
  
  // Required fields
  if (!email || !firstName || !lastName || !role) {
    throw new Error('Missing required fields');
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Password strength
  if (password && password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Valid roles
  const validRoles = ['admin', 'doctor', 'assistant', 'staff'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  return true;
}
```

---

## Environment Variables

Required environment variables for Edge Functions:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**Security Notes:**
- `SERVICE_ROLE_KEY` must **never** be exposed to the frontend
- Only use `SERVICE_ROLE_KEY` in Edge Functions
- Frontend uses `ANON_KEY` with Row Level Security (RLS) policies

---

## Testing the Flow

### Manual Testing Steps

1. **Test Email Update**
   ```bash
   # As Admin, update user email
   curl -X PATCH \
     https://your-project.supabase.co/functions/v1/user-management \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-uuid",
       "email": "newemail@example.com"
     }'
   ```

2. **Verify Update**
   ```sql
   -- Check public.users
   SELECT id, email, first_name, last_name, updated_at 
   FROM public.users 
   WHERE id = 'user-uuid';
   
   -- Check auth.users (via Supabase Dashboard)
   -- Navigate to Authentication → Users
   -- Verify email matches
   ```

3. **Test Login**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'newemail@example.com',
     password: 'current-password'
   });
   ```

### Automated Testing

```typescript
describe('User Email/Password Update', () => {
  test('Admin can update user email', async () => {
    const response = await fetch(edgeFunctionUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        email: 'updated@example.com'
      })
    });
    
    expect(response.ok).toBe(true);
    
    // Verify public.users updated
    const { data: publicUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', testUserId)
      .single();
    
    expect(publicUser.email).toBe('updated@example.com');
    
    // Verify can login with new email
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: 'updated@example.com',
      password: testPassword
    });
    
    expect(error).toBeNull();
    expect(authData.user).toBeTruthy();
  });
});
```

---

## Troubleshooting

### Issue: Email updated in public but not in auth

**Symptoms:**
- User record shows new email in database
- Login fails with new email
- Old email still works

**Diagnosis:**
```sql
-- Compare emails between tables
SELECT 
  u.id,
  u.email as public_email,
  au.email as auth_email
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email != au.email;
```

**Solution:**
```typescript
// Manually sync auth email
await supabase.auth.admin.updateUserById(userId, {
  email: publicUser.email,
  email_confirm: true
});
```

### Issue: Doctor cannot update assistant

**Symptoms:**
- Error: "You can only manage your own assistants"
- Doctor should have access

**Diagnosis:**
```sql
-- Check doctor-assistant relationship
SELECT * FROM doctor_assistants
WHERE doctor_id = 'doctor-uuid'
AND assistant_id = 'assistant-uuid';
```

**Solution:**
- Ensure relationship exists in `doctor_assistants` table
- Verify assistant is assigned to the correct doctor

### Issue: Edge Function returns 401 Unauthorized

**Symptoms:**
- All Edge Function calls fail with 401
- Authorization header present

**Diagnosis:**
- Check if token is expired
- Verify token format: `Bearer <token>`

**Solution:**
```typescript
// Refresh session
const { data: { session } } = await supabase.auth.refreshSession();
const newToken = session?.access_token;
```

---

## Best Practices

### 1. Always Update Both Systems

✅ **DO:**
```typescript
// Update public first, then auth
await updatePublicUser(userId, data);
await updateAuthUser(userId, data);
```

❌ **DON'T:**
```typescript
// Only update public (auth will be out of sync)
await updatePublicUser(userId, data);
```

### 2. Use Edge Functions for Auth Updates

✅ **DO:**
```typescript
// Use Edge Function with SERVICE_ROLE_KEY
await fetch('/functions/v1/user-management', {
  method: 'PATCH',
  body: JSON.stringify({ userId, email, password })
});
```

❌ **DON'T:**
```typescript
// Try to use admin methods with ANON_KEY (will fail)
await supabase.auth.admin.updateUserById(userId, { email });
```

### 3. Validate Input Before Updating

✅ **DO:**
```typescript
if (!email || !isValidEmail(email)) {
  throw new Error('Invalid email');
}
await updateUser({ email });
```

❌ **DON'T:**
```typescript
// Update without validation
await updateUser({ email: userInput });
```

### 4. Handle Errors Gracefully

✅ **DO:**
```typescript
try {
  await updateUser(data);
} catch (error) {
  console.error('Update failed:', error);
  showUserFriendlyError('Failed to update user. Please try again.');
}
```

❌ **DON'T:**
```typescript
// Silent failure
await updateUser(data).catch(() => {});
```

---

## Conclusion

SmartDoc successfully handles email and password updates by:

1. **Using Edge Functions** to bridge the gap between frontend (ANON_KEY) and auth system (SERVICE_ROLE_KEY)
2. **Maintaining Sync** between `public.users` and `auth.users` tables
3. **Implementing Proper Authorization** with role-based access control
4. **Skipping Email Verification** for internal system efficiency with `email_confirm: true`
5. **Providing Multiple Update Paths** (PUT for full updates, PATCH for partial updates)
6. **Ensuring Security** through token verification and permission checks

This architecture ensures that when an admin or doctor updates a user's email or password, the changes are immediately reflected in both the database and authentication system, allowing users to log in right away with their updated credentials.

