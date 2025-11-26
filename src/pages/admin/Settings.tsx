import React from 'react';
import { Settings as SettingsIcon, Construction } from 'lucide-react';
import { Card } from '../../components/common/Card';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-slate-400">Configuration de l'application</p>
      </div>

      <Card className="text-center py-16">
        <Construction className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">En Cours de Développement</h2>
        <p className="text-slate-400 mb-4">
          La page des paramètres sera bientôt disponible.
        </p>
        <p className="text-slate-500 text-sm">
          Les paramètres de configuration seront ajoutés dans une future version.
        </p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2" />
          Paramètres à Venir
        </h3>
        <div className="space-y-3 text-slate-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Gestion des catégories de produits</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Configuration des notifications</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Paramètres de sécurité</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Configuration des emails</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Préférences de l'application</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
