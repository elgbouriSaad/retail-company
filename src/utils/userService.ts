/**
 * User Management Service - Database operations for user management (admin)
 */

import { supabase } from '../lib/supabase';
const fromUsers = () => (supabase as unknown as any).from('users');

import type { Database } from '../lib/database.types';
import { User } from '../types';

type DbUserRow = Database['public']['Tables']['users']['Row'];

const mapDbUserToUser = (user: DbUserRow): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role.toLowerCase() as 'user' | 'admin',
  phone: user.phone || undefined,
  address: user.address || undefined,
  avatar: user.avatar || undefined,
  createdAt: user.created_at,
  isBlocked: user.is_blocked,
});

/**
 * Fetch all users (admin only)
 */
export async function fetchAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await fromUsers()
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data || []) as DbUserRow[];
    return rows.map(mapDbUserToUser);
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
    const { data, error } = await fromUsers()
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return mapDbUserToUser(data as DbUserRow);
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
    const { error } = await fromUsers()
      .update({ role } as Partial<DbUserRow>)
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
    const { error } = await fromUsers()
      .update({ is_blocked: isBlocked } as Partial<DbUserRow>)
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
    const { error } = await (supabase as unknown as {
      rpc: (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: unknown; error: Error | null }>;
    }).rpc('delete_user_completely', {
      p_user_id: userId,
    });

    if (error) throw error;
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
    const updateData: Partial<DbUserRow> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

    const { data, error } = await fromUsers()
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return mapDbUserToUser(data as DbUserRow);
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
    const { data, error } = await fromUsers()
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data || []) as DbUserRow[];
    return rows.map(mapDbUserToUser);
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
    const { count: totalUsers } = await fromUsers()
      .select('*', { count: 'exact', head: true });

    const { count: blockedUsers } = await fromUsers()
      .select('*', { count: 'exact', head: true })
      .eq('is_blocked', true);

    const { count: adminUsers } = await fromUsers()
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
    const { data, error } = await fromUsers()
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

