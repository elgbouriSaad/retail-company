/**
 * User Profile Hook
 * Fetches and manages user profile data from public.users table
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  avatar?: string;
  isBlocked: boolean;
  createdAt: string;
}

export function useUserProfile() {
  const { session, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          name: data.name,
          role: (data.role as string).toLowerCase() as 'user' | 'admin',
          phone: data.phone || undefined,
          address: data.address || undefined,
          avatar: data.avatar || undefined,
          isBlocked: data.is_blocked,
          createdAt: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile> & { password?: string }): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Check if we need to update auth (email or password change)
      const needsAuthUpdate = 
        (updates.email && updates.email !== profile?.email) || 
        updates.password;

      if (needsAuthUpdate) {
        // Use Edge Function for auth-related updates
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Session expirée. Veuillez vous reconnecter.');
          return false;
        }

        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management`;
        const response = await fetch(functionUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: user.id,
            name: updates.name,
            email: updates.email,
            phone: updates.phone,
            address: updates.address,
            password: updates.password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Edge Function error:', errorData);
          alert(errorData.error || 'Impossible de mettre à jour le profil.');
          return false;
        }

        const result = await response.json();
        
        // Refresh profile
        await fetchProfile();
        
        // Show appropriate success message
        if (result.emailChanged && result.passwordChanged) {
          alert('Email et mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter avec vos nouvelles informations.');
        } else if (result.emailChanged) {
          alert('Email mis à jour avec succès ! Vous pouvez maintenant vous connecter avec votre nouvel email.');
        } else if (result.passwordChanged) {
          alert('Mot de passe mis à jour avec succès !');
        }
        
        return true;
      } else {
        // Direct update for non-auth fields (name, phone, address, avatar)
        const updateData: Record<string, string | null> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.phone !== undefined) updateData.phone = updates.phone || null;
        if (updates.address !== undefined) updateData.address = updates.address || null;
        if (updates.avatar !== undefined) updateData.avatar = updates.avatar || null;

        const { error } = await supabase
          .from('users')
          .update(updateData as never)
          .eq('id', user.id);

        if (error) throw error;

        // Refresh profile
        await fetchProfile();
        
        return true;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}

