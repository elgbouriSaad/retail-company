import React, { useState } from 'react';
import { Users, Search, UserCheck, UserX, Eye, Trash2, Shield, ShieldOff } from 'lucide-react';
import { mockUsers, mockOrders } from '../../data/mockData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleBlock = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user
    ));
    const user = users.find(u => u.id === userId);
    alert(`User ${user?.name} has been ${user?.isBlocked ? 'unblocked' : 'blocked'} successfully!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      alert('User deleted successfully!');
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handlePromoteUser = (userId: string) => {
    if (confirm('Are you sure you want to promote this user to admin?')) {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: 'admin' } : user
      ));
      alert('User promoted to admin successfully!');
    }
  };

  const handleDemoteUser = (userId: string) => {
    if (confirm('Are you sure you want to demote this admin to user?')) {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: 'user' } : user
      ));
      alert('Admin demoted to user successfully!');
    }
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (confirm(`Are you sure you want to reset password for ${user?.name}?`)) {
      // In a real app, this would send a password reset email
      alert(`Password reset email sent to ${user?.email}`);
    }
  };

  const getUserOrders = (userId: string) => {
    return mockOrders.filter(order => order.userId === userId);
  };

  const getTotalSpent = (userId: string) => {
    return getUserOrders(userId).reduce((total, order) => total + order.totalAmount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={Search}
          />

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <div className="text-slate-300 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            {filteredUsers.length} users
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-300 font-medium">User</th>
                <th className="text-left py-3 text-slate-300 font-medium">Role</th>
                <th className="text-left py-3 text-slate-300 font-medium">Orders</th>
                <th className="text-left py-3 text-slate-300 font-medium">Total Spent</th>
                <th className="text-left py-3 text-slate-300 font-medium">Status</th>
                <th className="text-left py-3 text-slate-300 font-medium">Joined</th>
                <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userOrders = getUserOrders(user.id);
                const totalSpent = getTotalSpent(user.id);
                
                return (
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
                    <td className="py-4 text-slate-300">{userOrders.length}</td>
                    <td className="py-4 text-white font-semibold">${totalSpent.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isBlocked
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-green-400 bg-green-400/10'
                      }`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
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
                          View
                        </Button>
                        {user.role === 'user' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePromoteUser(user.id)}
                          >
                            Promote
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDemoteUser(user.id)}
                          >
                            Demote
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={user.isBlocked ? "secondary" : "ghost"}
                          icon={user.isBlocked ? ShieldOff : UserX}
                          onClick={() => handleToggleBlock(user.id)}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResetPassword(user.id)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
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
                <h4 className="text-white font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white ml-2">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-white ml-2">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Address:</span>
                    <span className="text-white ml-2">{selectedUser.address || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Joined:</span>
                    <span className="text-white ml-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Order Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Total Orders:</span>
                    <span className="text-white ml-2">{getUserOrders(selectedUser.id).length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Spent:</span>
                    <span className="text-white ml-2">${getTotalSpent(selectedUser.id).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Status:</span>
                    <span className={`ml-2 ${selectedUser.isBlocked ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Recent Orders</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getUserOrders(selectedUser.id).slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-2 bg-slate-700 rounded">
                    <div>
                      <span className="text-white text-sm">Order #{order.id}</span>
                      <span className="text-slate-400 text-xs ml-2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-semibold">${order.totalAmount.toFixed(2)}</span>
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
                {getUserOrders(selectedUser.id).length === 0 && (
                  <p className="text-slate-400 text-sm">No orders yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};