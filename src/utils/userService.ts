/**
 * User Management Service - Database operations for user management (admin)
 */

import { supabase } from '../lib/supabase';
import { User } from '../types';

/**
 * Fetch all users (admin only)
 */
export async function fetchAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase() as 'user' | 'admin',
      phone: user.phone || undefined,
      address: user.address || undefined,
      avatar: user.avatar || undefined,
      createdAt: user.created_at,
      isBlocked: user.is_blocked,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Fetch a single user by ID
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role.toLowerCase() as 'user' | 'admin',
      phone: data.phone || undefined,
      address: data.address || undefined,
      avatar: data.avatar || undefined,
      createdAt: data.created_at,
      isBlocked: data.is_blocked,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Block/unblock user (admin only)
 */
export async function toggleUserBlock(userId: string, isBlocked: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: isBlocked })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling user block:', error);
    throw error;
  }
}

/**
 * Delete user (admin only)
 * This will CASCADE delete all user's orders, messages, etc.
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // Delete from auth.users first (will CASCADE to public.users)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      // If admin API not available, delete from public.users
      // (this won't remove from auth.users, so user could potentially still login)
      console.warn('Could not delete auth user, removing from public.users only');
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }
): Promise<User> {
  try {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role.toLowerCase() as 'user' | 'admin',
      phone: data.phone || undefined,
      address: data.address || undefined,
      avatar: data.avatar || undefined,
      createdAt: data.created_at,
      isBlocked: data.is_blocked,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Search users by name or email
 */
export async function searchUsers(searchTerm: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase() as 'user' | 'admin',
      phone: user.phone || undefined,
      address: user.address || undefined,
      avatar: user.avatar || undefined,
      createdAt: user.created_at,
      isBlocked: user.is_blocked,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers: number;
}> {
  try {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: blockedUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_blocked', true);

    const { count: adminUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');

    return {
      totalUsers: totalUsers || 0,
      activeUsers: (totalUsers || 0) - (blockedUsers || 0),
      blockedUsers: blockedUsers || 0,
      adminUsers: adminUsers || 0,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      adminUsers: 0,
    };
  }
}

/**
 * Check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

