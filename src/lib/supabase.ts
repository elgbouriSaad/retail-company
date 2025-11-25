/**
 * =====================================================
 * SUPABASE CLIENT CONFIGURATION
 * =====================================================
 * This file configures the Supabase client for use
 * throughout the React application
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client instance (Singleton pattern)
 * - Uses TypeScript types from database.types.ts
 * - Configured with auth persistence and automatic token refresh
 * - Ensures only one client instance exists to avoid multiple client warnings
 */

// Check if client already exists (prevents multiple instances in StrictMode)
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

const createSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Store auth session in local storage
      storage: localStorage,
      // Automatically refresh tokens before they expire
      autoRefreshToken: true,
      // Persist session across browser sessions
      persistSession: true,
      // Detect session from URL (for email confirmations, password resets, etc.)
      detectSessionInUrl: true,
      // Use PKCE flow for enhanced security
      flowType: 'pkce',
      // Storage key
      storageKey: 'supabase.auth.token',
      // Debug mode off for production
      debug: false,
    },
    // Global headers for all requests
    global: {
      headers: {
        'x-application-name': 'retail-company-platform',
      },
    },
    // Realtime configuration (if needed for live updates)
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseInstance;
};

// Export the singleton instance
export const supabase = createSupabaseClient();

/**
 * =====================================================
 * HEALTH CHECK SYSTEM
 * =====================================================
 */

/**
 * Check Supabase connection health with retry logic
 * Implements exponential backoff for transient failures
 * @returns true if connection is healthy, false otherwise
 */
export const checkSupabaseHealth = async (): Promise<boolean> => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000; // 1 second base delay

  for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
    try {
      // Try to get current session as health check
      const { error } = await supabase.auth.getSession();

      // Check for invalid API key error
      if (error?.message?.includes('Invalid API key')) {
        console.error('❌ Supabase health check failed: Invalid API key');
        return false;
      }

      // If we got an error but have retries left, retry with backoff
      if (error && attempts < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY * Math.pow(2, attempts);
        console.warn(`⚠️ Supabase health check attempt ${attempts + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If error persists after all retries
      if (error) {
        console.error('❌ Supabase health check failed after all retries:', error);
        throw error;
      }

      // Health check passed
      console.log('✅ Supabase health check passed');
      return true;
    } catch (error) {
      console.error(`❌ Supabase health check error (attempt ${attempts + 1}/${MAX_RETRIES}):`, error);
      
      // If this was the last attempt, return false
      if (attempts === MAX_RETRIES - 1) {
        return false;
      }

      // Wait before retrying with exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempts);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
};

/**
 * =====================================================
 * HELPER FUNCTIONS
 * =====================================================
 */

/**
 * Get the current authenticated user
 * @returns User object or null if not authenticated
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return user;
};

/**
 * Get the current user's profile from the users table
 * @returns User profile object or null
 */
export const getUserProfile = async (): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  avatar?: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
} | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    address?: string;
    avatar?: string;
    is_blocked: boolean;
    created_at: string;
    updated_at: string;
  } | null;
};

/**
 * Check if current user is an admin
 * @returns boolean
 */
export const isAdmin = async () => {
  const profile = await getUserProfile();
  return profile?.role === 'ADMIN';
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * =====================================================
 * STORAGE HELPERS
 * =====================================================
 */

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param file - File to upload
 * @returns Public URL of uploaded file
 */
export const uploadFile = async (
  bucket: 'product-images' | 'custom-order-images' | 'avatars',
  path: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 */
export const deleteFile = async (
  bucket: 'product-images' | 'custom-order-images' | 'avatars',
  path: string
) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get a signed URL for private files (expires in 1 hour)
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns Signed URL
 */
export const getSignedUrl = async (
  bucket: 'custom-order-images' | 'avatars',
  path: string,
  expiresIn: number = 3600
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }

  return data.signedUrl;
};

/**
 * =====================================================
 * ERROR HANDLING
 * =====================================================
 */

/**
 * Format Supabase error for display
 * @param error - Supabase error object
 * @returns User-friendly error message
 */
export const formatSupabaseError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';

  const err = error as { code?: string; message?: string };

  // Handle specific error codes
  if (err.code === 'PGRST116') {
    return 'No data found';
  }
  if (err.code === '23505') {
    return 'This record already exists';
  }
  if (err.code === '23503') {
    return 'Cannot delete: related records exist';
  }
  if (err.message?.includes('JWT')) {
    return 'Session expired. Please log in again';
  }

  return err.message || 'An error occurred';
};

/**
 * =====================================================
 * TYPE EXPORTS
 * =====================================================
 */

// Export database types for use throughout the app
export type { Database } from './database.types';

// Export table row types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Convenience type exports
export type User = Tables<'users'>;
export type Product = Tables<'products'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type CustomOrder = Tables<'custom_orders'>;
export type Invoice = Tables<'invoices'>;
export type Payment = Tables<'payments'>;
export type ContactMessage = Tables<'contact_messages'>;
export type Setting = Tables<'settings'>;

export type UserRole = Enums<'user_role'>;
export type ProductCategory = Enums<'product_category'>;
export type OrderStatus = Enums<'order_status'>;
export type MessageStatus = Enums<'message_status'>;
export type InvoiceStatus = Enums<'invoice_status'>;
export type PaymentMethod = Enums<'payment_method'>;
export type DiscountType = Enums<'discount_type'>;

