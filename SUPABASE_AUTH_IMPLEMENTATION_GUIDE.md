# Supabase Authentication Implementation Guide

## Overview
This guide provides a comprehensive approach to implementing Supabase authentication with proper session persistence, refresh handling, and logout functionality.

---

## 1. How Supabase Authentication Works

### Core Concepts

#### **Session Management**
- Supabase stores authentication tokens in browser's `localStorage` by default
- Sessions consist of:
  - **Access Token**: Short-lived JWT token (default: 1 hour)
  - **Refresh Token**: Long-lived token used to get new access tokens
  - **User Object**: Contains user metadata and profile information

#### **Token Storage**
```javascript
// Supabase stores data in localStorage with this key:
// `sb-<project-ref>-auth-token`
```

#### **Automatic Token Refresh**
- Supabase client automatically refreshes expired access tokens using the refresh token
- This happens in the background without user intervention
- Refresh tokens are valid for 30 days by default (configurable in Supabase dashboard)

---

## 2. Session Persistence Strategy

### The Problem
- Page refresh causes components to re-render before session is restored
- This creates a "flash" of the login page even for authenticated users
- Multiple auth checks can conflict and cause stuck states

### The Solution: Three-Layer Approach

#### **Layer 1: Initial Session Check**
```typescript
// On app initialization, check for existing session
const { data: { session } } = await supabase.auth.getSession();
```

#### **Layer 2: Auth State Listener**
```typescript
// Listen for auth state changes (login, logout, token refresh)
supabase.auth.onAuthStateChange((event, session) => {
  // Handle: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
});
```

#### **Layer 3: Loading State Management**
```typescript
// Prevent rendering until auth state is determined
const [loading, setLoading] = useState(true);
const [session, setSession] = useState(null);

useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setLoading(false);
  });

  // Listen for changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
```

---

## 3. Complete Implementation Pattern

### A. Authentication Context Provider

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle specific events
      if (event === 'SIGNED_IN') {
        console.log('User signed in');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // State will be updated by onAuthStateChange listener
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### B. Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};
```

### C. Public Route Component (Prevents Logged-in Users from Accessing Login)

```typescript
// src/components/PublicRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { session, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to dashboard if already logged in
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render public content (login/signup)
  return <>{children}</>;
};
```

### D. Router Setup

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 4. Login Implementation

### Login Page with Proper State Management

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // No need to manually redirect - AuthContext and PublicRoute handle it
      console.log('Login successful:', data);
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 5. Logout Implementation

### Proper Logout Flow

```typescript
// In your header/navbar component
import { useAuth } from '../contexts/AuthContext';

export const Header = () => {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return; // Prevent double-click

    setLoggingOut(true);
    try {
      await signOut();
      // Navigation handled automatically by AuthContext + ProtectedRoute
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1>My App</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
```

---

## 6. Common Issues and Solutions

### Issue 1: Flash of Login Page on Refresh
**Problem**: User sees login page briefly before being redirected to dashboard

**Solution**: Use loading state in ProtectedRoute/PublicRoute to prevent rendering until auth state is determined

```typescript
if (loading) {
  return <LoadingSpinner />;
}
```

### Issue 2: Stuck After Clicking Sign In Again
**Problem**: User already logged in clicks sign in again, page gets stuck

**Solution**: Implement PublicRoute to redirect logged-in users away from login page

### Issue 3: Session Lost on Page Refresh
**Problem**: User loses session when refreshing page

**Solution**: 
- Ensure Supabase client is using `localStorage` (default)
- Call `getSession()` on app initialization
- Set up `onAuthStateChange` listener

### Issue 4: User Not Redirected After Login
**Problem**: User logs in but stays on login page

**Solution**: Combine AuthContext with PublicRoute component that automatically redirects authenticated users

---

## 7. Supabase Client Configuration

### Proper Client Initialization

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persist session in localStorage
    autoRefreshToken: true, // Automatically refresh token before expiry
    detectSessionInUrl: true, // Detect session from OAuth callback URL
    storage: window.localStorage, // Use localStorage for persistence
  },
});
```

---

## 8. Understanding Public vs Protected Routes

### Public Routes (Unauthenticated)
- Login page
- Signup page
- Password reset page
- Landing page (optional)

**Behavior**: 
- Allow access when NOT logged in
- Redirect to dashboard if already logged in
- Prevent duplicate login attempts

### Protected Routes (Authenticated)
- Dashboard
- User profile
- Settings
- Any feature requiring authentication

**Behavior**:
- Allow access when logged in
- Redirect to login if not authenticated
- Preserve attempted URL for post-login redirect (optional enhancement)

---

## 9. Advanced: Post-Login Redirect

### Remember Where User Wanted to Go

```typescript
// src/components/ProtectedRoute.tsx (enhanced)
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    // Save current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// src/pages/LoginPage.tsx (enhanced)
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    // ... login logic ...
    
    // After successful login
    navigate(from, { replace: true });
  };

  // ... rest of component
}
```

---

## 10. Testing Checklist

### ✅ Session Persistence
- [ ] User can log in successfully
- [ ] Page refresh keeps user logged in
- [ ] Closing and reopening browser (within 30 days) keeps user logged in
- [ ] Token automatically refreshes when expired

### ✅ Login Flow
- [ ] Login page accessible when not logged in
- [ ] Login page redirects to dashboard when already logged in
- [ ] Invalid credentials show error message
- [ ] Loading state prevents double submission

### ✅ Logout Flow
- [ ] Logout button works correctly
- [ ] User redirected to login page after logout
- [ ] Session completely cleared from storage
- [ ] Cannot access protected routes after logout

### ✅ Protected Routes
- [ ] Protected routes accessible when logged in
- [ ] Protected routes redirect to login when not logged in
- [ ] No flash of wrong page during auth check

### ✅ Edge Cases
- [ ] Multiple tabs stay in sync
- [ ] Network errors handled gracefully
- [ ] Token refresh failures trigger re-login
- [ ] Race conditions prevented with loading states

---

## 11. Key Takeaways

1. **Always check session on app initialization** using `getSession()`
2. **Set up auth state listener** with `onAuthStateChange()`
3. **Use loading states** to prevent flash of wrong content
4. **Implement both PublicRoute and ProtectedRoute** components
5. **Let Supabase handle token refresh** automatically
6. **Clear session completely on logout** with `signOut()`
7. **Use React Context** for global auth state management
8. **Prevent double-clicks** on login/logout buttons
9. **Store sessions in localStorage** for persistence (default behavior)
10. **Test all flows thoroughly** including edge cases

---

## 12. Debugging Tips

### Check Browser Storage
```javascript
// In browser console
localStorage.getItem('sb-<your-project-ref>-auth-token')
```

### Enable Supabase Debug Logging
```typescript
// Add to your app initialization
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth State Change:', event, session);
});
```

### Common Console Checks
```javascript
// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

---

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client Reference](https://supabase.com/docs/reference/javascript/auth-api)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated**: November 2025
**Supabase JS Client Version**: v2.x

