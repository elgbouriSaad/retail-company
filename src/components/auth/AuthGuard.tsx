import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
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

  // Check role if required
  if (requiredRole) {
    if (userRole !== requiredRole) {
      // Redirect based on actual role instead of showing access denied
      if (userRole === 'admin') {
        // User is admin but trying to access user page, redirect to admin dashboard
        return <Navigate to="/admin/dashboard" replace />;
      } else {
        // User is not admin but trying to access admin page, redirect to user dashboard
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};