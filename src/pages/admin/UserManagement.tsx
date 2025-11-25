import React, { useState, useEffect } from 'react';
import { Users, Search, UserCheck, UserX, Eye, Trash2, Shield, ShieldOff } from 'lucide-react';
import { User, Order } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { 
  fetchAllUsers, 
  toggleUserBlock, 
  updateUserRole, 
  deleteUser 
} from '../../utils/userService';
import { fetchUserOrders } from '../../utils/orderService';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<Order[]>([]);
  const [selectedUserStats, setSelectedUserStats] = useState({ orderCount: 0, totalSpent: 0 });

  // Load users from database on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users. Please refresh the page.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleBlock = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      await toggleUserBlock(userId, !user.isBlocked);
      alert(`L'utilisateur ${user.name} a été ${user.isBlocked ? 'débloqué' : 'bloqué'} avec succès !`);
      await loadUsers();
    } catch (error) {
      console.error('Error toggling user block:', error);
      alert('Erreur lors du blocage/déblocage de l\'utilisateur.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action ne peut pas être annulée.')) {
      return;
    }

    try {
      await deleteUser(userId);
      alert('Utilisateur supprimé avec succès !');
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur.');
    }
  };

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    
    // Load user's orders
    try {
      const orders = await getUserOrders(user.id);
      setSelectedUserOrders(orders);
      
      const totalSpent = orders.reduce((total, order) => total + order.totalAmount, 0);
      setSelectedUserStats({
        orderCount: orders.length,
        totalSpent: totalSpent,
      });
    } catch (error) {
      console.error('Error loading user orders:', error);
      setSelectedUserOrders([]);
      setSelectedUserStats({ orderCount: 0, totalSpent: 0 });
    }
  };

  const handlePromoteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir promouvoir cet utilisateur en admin ?')) {
      return;
    }

    try {
      await updateUserRole(userId, 'ADMIN');
      alert('Utilisateur promu en admin avec succès !');
      await loadUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Erreur lors de la promotion de l\'utilisateur.');
    }
  };

  const handleDemoteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rétrograder cet admin en utilisateur ?')) {
      return;
    }

    try {
      await updateUserRole(userId, 'USER');
      alert('Admin rétrogradé en utilisateur avec succès !');
      await loadUsers();
    } catch (error) {
      console.error('Error demoting user:', error);
      alert('Erreur lors de la rétrogradation de l\'utilisateur.');
    }
  };

  const getUserOrders = async (userId: string) => {
    try {
      const orders = await fetchUserOrders(userId);
      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Utilisateurs</h1>
          <p className="text-slate-400">Gérez les comptes utilisateurs et les permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={Search}
          />

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les Rôles</option>
            <option value="user">Utilisateurs</option>
            <option value="admin">Admins</option>
          </select>

          <div className="text-slate-300 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            {filteredUsers.length} utilisateurs
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-300 font-medium">Utilisateur</th>
                <th className="text-left py-3 text-slate-300 font-medium">Rôle</th>
                <th className="text-left py-3 text-slate-300 font-medium">Statut</th>
                <th className="text-left py-3 text-slate-300 font-medium">Inscrit</th>
                <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name}</p>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'text-purple-400 bg-purple-400/10'
                          : 'text-blue-400 bg-blue-400/10'
                      }`}>
                        {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isBlocked
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-green-400 bg-green-400/10'
                      }`}>
                        {user.isBlocked ? 'Bloqué' : 'Actif'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => handleViewUser(user)}
                        >
                          Voir
                        </Button>
                        {user.role === 'user' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePromoteUser(user.id)}
                          >
                            Promouvoir
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDemoteUser(user.id)}
                          >
                            Rétrograder
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={user.isBlocked ? "secondary" : "ghost"}
                          icon={user.isBlocked ? ShieldOff : UserX}
                          onClick={() => handleToggleBlock(user.id)}
                        >
                          {user.isBlocked ? 'Débloquer' : 'Bloquer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Détails de l'Utilisateur"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedUser.name}</h3>
                <p className="text-slate-400">{selectedUser.email}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  selectedUser.role === 'admin'
                    ? 'text-purple-400 bg-purple-400/10'
                    : 'text-blue-400 bg-blue-400/10'
                }`}>
                  {selectedUser.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3">Informations de Contact</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white ml-2">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Téléphone:</span>
                    <span className="text-white ml-2">{selectedUser.phone || 'Non fourni'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Adresse:</span>
                    <span className="text-white ml-2">{selectedUser.address || 'Non fournie'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Inscrit:</span>
                    <span className="text-white ml-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Statistiques des Commandes</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Total Commandes:</span>
                    <span className="text-white ml-2">{selectedUserStats.orderCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Dépensé:</span>
                    <span className="text-white ml-2">{selectedUserStats.totalSpent.toFixed(2)} DH</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Statut du Compte:</span>
                    <span className={`ml-2 ${selectedUser.isBlocked ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedUser.isBlocked ? 'Bloqué' : 'Actif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Commandes Récentes</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedUserOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-2 bg-slate-700 rounded">
                    <div>
                      <span className="text-white text-sm">Commande #{order.id.substring(0, 8)}</span>
                      <span className="text-slate-400 text-xs ml-2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-semibold">{order.totalAmount.toFixed(2)} DH</span>
                      <span className={`block text-xs ${
                        order.status === 'delivered' ? 'text-green-400' :
                        order.status === 'in-progress' ? 'text-blue-400' :
                        'text-yellow-400'
                      }`}>
                        {order.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
                {selectedUserOrders.length === 0 && (
                  <p className="text-slate-400 text-sm">Aucune commande pour le moment</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};