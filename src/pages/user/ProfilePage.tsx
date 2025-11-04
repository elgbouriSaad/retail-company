import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Name and email are required fields.');
      return;
    }
    
    updateProfile(formData);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
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
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">{user?.name}</h2>
            <p className="text-slate-400 capitalize">{user?.role}</p>
            <p className="text-slate-500 text-sm mt-1">
              Member since {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-white font-medium mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Orders</span>
                <span className="text-white">12</span>
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
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  icon={Save}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};