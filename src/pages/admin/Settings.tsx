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
      alert('Le nom du site et l\'email de contact sont requis.');
      return;
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
          <p className="text-slate-400">Configurez les préférences de votre application</p>
        </div>
        <Button icon={Save} onClick={handleSave}>
          Enregistrer les Modifications
        </Button>
      </div>

      {showSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 font-medium">Paramètres enregistrés avec succès !</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2" />
            Paramètres Généraux
          </h2>
          
          <div className="space-y-4">
            <Input
              label="Nom du Site"
              value={settings.siteName}
              onChange={(value) => handleInputChange('siteName', value)}
              placeholder="Entrez le nom du site"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description du Site
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                placeholder="Entrez la description du site"
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            <Input
              label="Email de Contact"
              type="email"
              icon={Mail}
              value={settings.contactEmail}
              onChange={(value) => handleInputChange('contactEmail', value)}
              placeholder="support@exemple.com"
            />

            <Input
              label="Téléphone de Contact"
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
            Apparence
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Thème
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Sombre</option>
                <option value="light">Clair</option>
                <option value="auto">Automatique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Couleur Principale
              </label>
              <select
                value={settings.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="blue">Bleu</option>
                <option value="green">Vert</option>
                <option value="purple">Violet</option>
                <option value="red">Rouge</option>
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
                <p className="text-white font-medium">Notifications par Email</p>
                <p className="text-slate-400 text-sm">Recevoir des notifications par email</p>
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
                <p className="text-white font-medium">Notifications de Commandes</p>
                <p className="text-slate-400 text-sm">Être notifié des nouvelles commandes</p>
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
                <p className="text-white font-medium">Alertes de Stock Faible</p>
                <p className="text-slate-400 text-sm">Alerter lorsque les produits sont en rupture de stock</p>
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
            Sécurité
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Authentification à Deux Facteurs</p>
                <p className="text-slate-400 text-sm">Ajouter une couche de sécurité supplémentaire</p>
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
                Délai d'Expiration de Session (minutes)
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
            Paramètres Commerciaux
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Devise
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - Dollar Américain</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - Livre Sterling</option>
                <option value="CAD">CAD - Dollar Canadien</option>
                <option value="MAD">MAD - Dirham Marocain</option>
              </select>
            </div>

            <Input
              label="Taux de Taxe (%)"
              type="number"
              step="0.1"
              value={settings.taxRate.toString()}
              onChange={(value) => handleInputChange('taxRate', parseFloat(value))}
              placeholder="8.5"
            />

            <Input
              label="Frais de Livraison par Défaut (DH)"
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
            Langue et Région
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Langue par Défaut
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
                <option value="fr">Français</option>
                <option value="de">Allemand</option>
                <option value="it">Italien</option>
                <option value="ar">Arabe</option>
              </select>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                <strong>Note:</strong> La fonctionnalité de changement de langue est préparée pour une future implémentation. 
                Actuellement, l'application s'affiche en Français.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};