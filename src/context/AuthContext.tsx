import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      await checkUser();
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data && typeof data === 'object') {
        const userProfile: User = {
          id: (data as {id: string}).id,
          email: (data as {email: string}).email,
          name: (data as {name: string}).name,
          role: ((data as {role: string}).role as string).toLowerCase() as 'user' | 'admin',
          phone: (data as {phone?: string}).phone || undefined,
          address: (data as {address?: string}).address || undefined,
          avatar: (data as {avatar?: string}).avatar || undefined,
          createdAt: (data as {created_at: string}).created_at,
          isBlocked: (data as {is_blocked: boolean}).is_blocked,
        };
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for existing user session
  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          alert('Please confirm your email address before logging in. Check your inbox for the confirmation email.');
        } else {
          alert(`Login failed: ${error.message}`);
        }
        
        return false;
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
        
        // Check if user is blocked
        if (user?.isBlocked) {
          alert('Your account has been blocked. Please contact support.');
          await logout();
          return false;
        }
        
        console.log('✅ Login successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Login failed: ${errorMessage}`);
      return false;
    }
  };

  // Register new user
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'USER',
          },
          emailRedirectTo: undefined, // Disable email confirmation redirect
        },
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          alert('This email is already registered. Please try logging in instead.');
          return false;
        }
        
        alert(`Registration failed: ${error.message}`);
        return false;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is auto-confirmed, can login immediately
          console.log('✅ User registered and auto-confirmed');
          await fetchUserProfile(data.user.id);
          return true;
        } else {
          // Email confirmation required
          console.log('⚠️ Email confirmation required');
          alert('Registration successful! Please check your email to confirm your account before logging in.');
          // Don't set user yet, wait for confirmation
          setLoading(false);
          return true; // Registration succeeded, but needs confirmation
        }
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Registration failed: ${errorMessage}`);
      return false;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updates: Record<string, string | null> = {};
      
      if (userData.name) updates.name = userData.name;
      if (userData.phone !== undefined) updates.phone = userData.phone || null;
      if (userData.address !== undefined) updates.address = userData.address || null;
      if (userData.avatar !== undefined) updates.avatar = userData.avatar || null;

      const { error } = await supabase
        .from('users')
        .update(updates as never)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUser({ ...user, ...userData });
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};