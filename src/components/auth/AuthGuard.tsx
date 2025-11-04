import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from '../../pages/auth/LoginPage';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};