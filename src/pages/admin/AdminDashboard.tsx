import React, { useState } from 'react';
import { Users, Package, ShoppingCart, TrendingUp, DollarSign, Clock, Plus, Eye, AlertTriangle, BarChart3 } from 'lucide-react';
import { mockUsers, mockProducts, mockOrders } from '../../data/mockData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

export const AdminDashboard: React.FC = () => {
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'fabrics',
    sizes: '',
    stock: '',
    images: '',
  });

  const totalUsers = mockUsers.filter(u => u.role === 'user').length;
  const totalProducts = mockProducts.length;
  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
  const inProgressOrders = mockOrders.filter(o => o.status === 'in-progress').length;
  const deliveredOrders = mockOrders.filter(o => o.status === 'delivered').length;
  
  // Financial calculations
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRevenue = mockOrders
    .filter(o => o.status === 'pending')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const completedRevenue = mockOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const inProgressRevenue = mockOrders
    .filter(o => o.status === 'in-progress')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Monthly revenue calculation (mock data for last 6 months)
  const monthlyRevenue = [
    { month: 'Jan', revenue: 2400, orders: 12 },
    { month: 'Feb', revenue: 1800, orders: 8 },
    { month: 'Mar', revenue: 3200, orders: 15 },
    { month: 'Apr', revenue: 2800, orders: 13 },
    { month: 'May', revenue: 3600, orders: 18 },
    { month: 'Jun', revenue: completedRevenue, orders: deliveredOrders },
  ];

  const orderStatusData = [
    { status: 'En Attente', count: pendingOrders, color: 'bg-yellow-500', revenue: pendingRevenue },
    { status: 'En Cours', count: inProgressOrders, color: 'bg-blue-500', revenue: inProgressRevenue },
    { status: 'Livrées', count: deliveredOrders, color: 'bg-green-500', revenue: completedRevenue },
  ];

  const lowStockProducts = mockProducts.filter(p => p.stock < 10);
  const outOfStockProducts = mockProducts.filter(p => p.stock === 0);

  const handleAddProduct = () => {
    // In a real app, this would call an API
    console.log('Adding product:', productForm);
    setShowAddProductModal(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'fabrics',
      sizes: '',
      stock: '',
      images: '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tableau de Bord Admin</h1>
        <p className="text-slate-400">Aperçu de vos métriques et performances commerciales</p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalRevenue.toFixed(2)} DH</p>
          <p className="text-slate-400">Revenu Total</p>
          <div className="mt-2 text-xs">
            <span className="text-green-400">↗ +12.5%</span>
            <span className="text-slate-500 ml-1">vs mois dernier</span>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{completedRevenue.toFixed(2)} DH</p>
          <p className="text-slate-400">Revenu Complété</p>
          <div className="mt-2 text-xs">
            <span className="text-blue-400">{deliveredOrders} commandes</span>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{pendingRevenue.toFixed(2)} DH</p>
          <p className="text-slate-400">Revenu en Attente</p>
          <div className="mt-2 text-xs">
            <span className="text-yellow-400">{pendingOrders} commandes</span>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{(totalRevenue / totalOrders).toFixed(2)} DH</p>
          <p className="text-slate-400">Valeur Moyenne</p>
          <div className="mt-2 text-xs">
            <span className="text-purple-400">↗ +8.2%</span>
            <span className="text-slate-500 ml-1">vs mois dernier</span>
          </div>
        </Card>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
          <p className="text-slate-400">Total Utilisateurs</p>
        </Card>

        <Card className="text-center">
          <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalProducts}</p>
          <p className="text-slate-400">Articles</p>
          {lowStockProducts.length > 0 && (
            <div className="mt-1 text-xs text-yellow-400">
              {lowStockProducts.length} stock faible
            </div>
          )}
        </Card>

        <Card className="text-center">
          <ShoppingCart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalOrders}</p>
          <p className="text-slate-400">Total Commandes</p>
        </Card>

        <Card className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{outOfStockProducts.length}</p>
          <p className="text-slate-400">Rupture de Stock</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Tendance du Revenu Mensuel</h2>
          <div className="space-y-4">
            {monthlyRevenue.map((month, index) => {
              const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
              const percentage = (month.revenue / maxRevenue) * 100;
              
              return (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 w-20">
                    <span className="text-slate-300 font-medium">{month.month}</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <span className="text-white font-semibold">{month.revenue.toFixed(0)} DH</span>
                    <div className="text-xs text-slate-400">{month.orders} commandes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Order Status with Revenue */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Order Status & Revenue</h2>
          <div className="space-y-4">
            {orderStatusData.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                  <span className="text-slate-300">{item.status}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white font-semibold">{item.count} commandes</div>
                    <div className="text-slate-400 text-sm">{item.revenue.toFixed(2)} DH</div>
                  </div>
                  <div className="w-24 bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${(item.count / totalOrders) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {mockOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    Commande #{order.id} - {order.totalAmount.toFixed(2)} DH
                  </p>
                  <p className="text-slate-400 text-xs">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered' ? 'text-green-400 bg-green-400/10' :
                  order.status === 'in-progress' ? 'text-blue-400 bg-blue-400/10' :
                  'text-yellow-400 bg-yellow-400/10'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Inventory Alerts</h2>
          <div className="space-y-3">
            {outOfStockProducts.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">Rupture de Stock</span>
                </div>
                {outOfStockProducts.slice(0, 3).map(product => (
                  <div key={product.id} className="text-sm text-slate-300">
                    {product.name}
                  </div>
                ))}
              </div>
            )}
            
            {lowStockProducts.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Stock Faible</span>
                </div>
                {lowStockProducts.slice(0, 3).map(product => (
                  <div key={product.id} className="text-sm text-slate-300 flex justify-between">
                    <span>{product.name}</span>
                    <span className="text-yellow-400">{product.stock} restant</span>
                  </div>
                ))}
              </div>
            )}

            {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
              <div className="text-center py-4">
                <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-400">All products in stock</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
            onClick={() => setShowAddProductModal(true)}
          >
            <Package className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="text-white font-semibold">Add New Product</h3>
            <p className="text-slate-400 text-sm">Create a new product listing</p>
          </div>

          <div 
            className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
            onClick={() => setShowPendingOrdersModal(true)}
          >
            <Clock className="w-8 h-8 text-yellow-500 mb-2" />
            <h3 className="text-white font-semibold">Commandes en Attente</h3>
            <p className="text-slate-400 text-sm">{pendingOrders} commandes nécessitent votre attention</p>
          </div>

          <div 
            className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
            onClick={() => setShowAnalyticsModal(true)}
          >
            <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="text-white font-semibold">Analytics</h3>
            <p className="text-slate-400 text-sm">View detailed reports</p>
          </div>
        </div>
      </Card>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        title="Ajouter un Nouvel Article"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom de l'Article"
            value={productForm.name}
            onChange={(value) => setProductForm(prev => ({ ...prev, name: value }))}
            placeholder="Entrez le nom de l'article"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Entrez la description de l'article"
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prix"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(value) => setProductForm(prev => ({ ...prev, price: value }))}
              placeholder="0.00"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Catégorie
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fabrics">Fabrics</option>
                <option value="clothes">Clothes</option>
                <option value="kits">Sewing Kits</option>
                <option value="threads">Threads</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tailles (séparées par des virgules)"
              value={productForm.sizes}
              onChange={(value) => setProductForm(prev => ({ ...prev, sizes: value }))}
              placeholder="XS, S, M, L, XL"
            />

            <Input
              label="Quantité en Stock"
              type="number"
              value={productForm.stock}
              onChange={(value) => setProductForm(prev => ({ ...prev, stock: value }))}
              placeholder="0"
              required
            />
          </div>

          <Input
            label="URLs des Images (séparées par des virgules)"
            value={productForm.images}
            onChange={(value) => setProductForm(prev => ({ ...prev, images: value }))}
            placeholder="https://exemple.com/image1.jpg, https://exemple.com/image2.jpg"
          />

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleAddProduct}>
              Ajouter l'Article
            </Button>
            <Button variant="secondary" onClick={() => setShowAddProductModal(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pending Orders Modal */}
      <Modal
        isOpen={showPendingOrdersModal}
        onClose={() => setShowPendingOrdersModal(false)}
        title="Commandes en Attente"
        size="lg"
      >
        <div className="space-y-4">
          {mockOrders.filter(o => o.status === 'pending').map((order) => {
            const user = mockUsers.find(u => u.id === order.userId);
            return (
              <div key={order.id} className="p-4 bg-slate-700 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-semibold">Commande #{order.id}</h4>
                    <p className="text-slate-400 text-sm">{user?.name} - {user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{order.totalAmount.toFixed(2)} DH</p>
                    <p className="text-slate-400 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 mb-3">
                  {order.products.map((product, idx) => (
                    <div key={idx} className="text-sm text-slate-300">
                      {product.productName} (x{product.quantity}) - {product.size}
                    </div>
                  ))}
                </div>
                <Button size="sm">
                  Start Processing
                </Button>
              </div>
            );
          })}
          {mockOrders.filter(o => o.status === 'pending').length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-400">No pending orders</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        title="Aperçu des Analyses"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <h4 className="text-white font-semibold">Conversion Rate</h4>
              <p className="text-2xl font-bold text-green-400">68.5%</p>
              <p className="text-slate-400 text-sm">Orders vs Visitors</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <h4 className="text-white font-semibold">Customer Retention</h4>
              <p className="text-2xl font-bold text-blue-400">42.3%</p>
              <p className="text-slate-400 text-sm">Repeat Customers</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <h4 className="text-white font-semibold">Growth Rate</h4>
              <p className="text-2xl font-bold text-purple-400">+15.2%</p>
              <p className="text-slate-400 text-sm">Month over Month</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Top Selling Products</h4>
            <div className="space-y-3">
              {mockProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 font-mono">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-slate-400 text-sm">{product.price.toFixed(2)} DH</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{Math.floor(Math.random() * 50) + 10} vendus</p>
                    <p className="text-green-400 text-sm">
                      {((Math.floor(Math.random() * 50) + 10) * product.price).toFixed(2)} DH
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};