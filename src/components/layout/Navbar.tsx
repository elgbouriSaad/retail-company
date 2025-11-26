import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  ShoppingCart, 
  Phone, 
  User, 
  Users,
  Package,
  BarChart3,
  FileText,
  LogOut,
  Scissors
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const { session, user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();

  // Get user info from profile (preferred) or session fallback
  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userRole = profile?.role || user?.user_metadata?.role?.toLowerCase() || 'user';

  const userNavItems = [
    { path: '/dashboard', icon: Home, label: 'Tableau de Bord' },
    { path: '/shop', icon: ShoppingBag, label: 'Boutique' },
    { path: '/contact', icon: Phone, label: 'Contact' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', icon: BarChart3, label: 'Tableau de Bord' },
    { path: '/admin/catalogue', icon: Package, label: 'Catalogue' },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Commandes & Paiements' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userNavItems;

  return (
    <nav className="bg-slate-900 border-r border-slate-700 w-64 min-h-screen fixed left-0 top-0 z-40">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2 mb-8">
          <Scissors className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold text-white">SewCraft</span>
        </Link>

        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 space-y-2">
          <Link
            to="/profile"
            className="flex items-center space-x-3 mb-2 text-slate-200 hover:text-white"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {userName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{userName}</p>
              <p className="text-slate-400 text-sm capitalize">{userRole}</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={signOut}
            className="w-full justify-start"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </nav>
  );
};