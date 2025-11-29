import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RoleBasedRedirect component
 * Redirects users to their appropriate dashboard based on their role
 * - Admins -> /admin/dashboard
 * - Users -> /dashboard
 * - Not authenticated -> /login
 */
export const RoleBasedRedirect: React.FC = () => {
  const { session, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Get user role from user_metadata
  const userRole = session.user.user_metadata?.role?.toLowerCase() || 'user';

  // Redirect based on role
  if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

