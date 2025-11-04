import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Globe, Palette, Bell, Shield, Database, Mail } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'SewCraft',
    siteDescription: 'Premium Sewing Products and Materials',
    contactEmail: 'support@sewcraft.com',
    contactPhone: '+1 (555) 123-4567',
    
    // Appearance
    theme: 'dark',
    primaryColor: 'blue',
    
    // Notifications
    emailNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // Business
    currency: 'USD',
    taxRate: 8.5,
    shippingRate: 15.00,
    
    // Language
    defaultLanguage: 'en',
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to an API
    console.log('Settings saved:', settings);
    
    // Validate required fields
    if (!settings.siteName || !settings.contactEmail) {
      alert('Site name and contact email are required.');
      return;
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Configure your application preferences</p>
        </div>
        <Button icon={Save} onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {showSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2" />
            General Settings
          </h2>
          
          <div className="space-y-4">
            <Input
              label="Site Name"
              value={settings.siteName}
              onChange={(value) => handleInputChange('siteName', value)}
              placeholder="Enter site name"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Site Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                placeholder="Enter site description"
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            <Input
              label="Contact Email"
              type="email"
              icon={Mail}
              value={settings.contactEmail}
              onChange={(value) => handleInputChange('contactEmail', value)}
              placeholder="support@example.com"
            />

            <Input
              label="Contact Phone"
              value={settings.contactPhone}
              onChange={(value) => handleInputChange('contactPhone', value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Palette className="w-6 h-6 mr-2" />
            Appearance
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Primary Color
              </label>
              <select
                value={settings.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="red">Red</option>
                <option value="orange">Orange</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Bell className="w-6 h-6 mr-2" />
            Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-slate-400 text-sm">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Order Notifications</p>
                <p className="text-slate-400 text-sm">Get notified about new orders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.orderNotifications}
                  onChange={(e) => handleInputChange('orderNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Low Stock Alerts</p>
                <p className="text-slate-400 text-sm">Alert when products are low in stock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.lowStockAlerts}
                  onChange={(e) => handleInputChange('lowStockAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Security
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-slate-400 text-sm">Add an extra layer of security</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', Number(e.target.value))}
                min="5"
                max="120"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Business Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Database className="w-6 h-6 mr-2" />
            Business Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.1"
              value={settings.taxRate.toString()}
              onChange={(value) => handleInputChange('taxRate', parseFloat(value))}
              placeholder="8.5"
            />

            <Input
              label="Default Shipping Rate ($)"
              type="number"
              step="0.01"
              value={settings.shippingRate.toString()}
              onChange={(value) => handleInputChange('shippingRate', parseFloat(value))}
              placeholder="15.00"
            />
          </div>
        </Card>

        {/* Language Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Globe className="w-6 h-6 mr-2" />
            Language & Region
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Default Language
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                <strong>Note:</strong> Language switching functionality is prepared for future implementation. 
                Currently, the application displays in English.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};