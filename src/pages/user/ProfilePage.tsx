import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Package, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { fetchCustomOrders } from '../../utils/customOrderService';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Load total orders count
  useEffect(() => {
    const loadOrderCount = async () => {
      try {
        const orders = await fetchCustomOrders();
        setTotalOrders(orders.length);
      } catch (error) {
        console.error('Error loading order count:', error);
        setTotalOrders(0);
      }
    };
    loadOrderCount();
  }, []);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    } else if (user) {
      // Fallback to session data if profile not loaded yet
      setFormData({
        name: user.user_metadata?.name as string || '',
        email: user.email || '',
        phone: '',
        address: '',
      });
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Le nom et l\'email sont obligatoires.');
      return;
    }

    // Validate password if provided
    if (formData.password && formData.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    const updates: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    };

    // Include password if provided
    if (formData.password) {
      updates.password = formData.password;
    }

    const success = await updateProfile(updates);
    if (success) {
      setIsEditing(false);
      setShowPasswordSection(false);
      setFormData(prev => ({ ...prev, password: '' }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert('Échec de la mise à jour du profil. Veuillez réessayer.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        password: '',
      });
    }
    setIsEditing(false);
    setShowPasswordSection(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card>
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">
                {(profile?.name || formData.name)?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">{profile?.name || formData.name}</h2>
            <p className="text-slate-400 capitalize">{profile?.role || 'user'}</p>
            <p className="text-slate-500 text-sm mt-1">
              Member since {new Date(profile?.createdAt || '').toLocaleDateString()}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-white font-medium mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center">
                  <Package className="w-3 h-3 mr-1" />
                  Total Orders
                </span>
                <span className="text-white font-semibold">{totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Status</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium">Profile updated successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              icon={User}
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              disabled={!isEditing}
              required
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              disabled={!isEditing}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              icon={Phone}
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              placeholder="Enter your phone number"
              disabled={!isEditing}
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your full address"
                  rows={3}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
                />
              </div>
            </div>

            {isEditing && (
              <>
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Changer le mot de passe (optionnel)
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                    >
                      {showPasswordSection ? 'Masquer' : 'Afficher'}
                    </Button>
                  </div>
                  
                  {showPasswordSection && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Nouveau mot de passe (min. 6 caractères)"
                        className="w-full pl-10 pr-12 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  {showPasswordSection && formData.password && formData.password.length < 6 && (
                    <p className="text-red-400 text-xs mt-1">Le mot de passe doit contenir au moins 6 caractères</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    icon={Save}
                  >
                    Enregistrer les modifications
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                </div>
              </>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};