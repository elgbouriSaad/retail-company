import React, { useState, useEffect } from 'react';
import { Package, Truck, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { fetchCustomOrders } from '../../utils/customOrderService';
import { Order } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchCustomOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    inProgress: orders.filter(o => o.status === 'in-progress').length,
    pending: orders.filter(o => o.status === 'pending').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in-progress':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Package className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-400 bg-green-400/10';
      case 'in-progress':
        return 'text-blue-400 bg-blue-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name || 'User'}!</h1>
        <p className="text-slate-400">Here's an overview of all custom orders.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{orderStats.total}</p>
          <p className="text-slate-400">Total Orders</p>
        </Card>

        <Card className="text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{orderStats.delivered}</p>
          <p className="text-slate-400">Delivered</p>
        </Card>

        <Card className="text-center">
          <Truck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{orderStats.inProgress}</p>
          <p className="text-slate-400">In Progress</p>
        </Card>

        <Card className="text-center">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{orderStats.pending}</p>
          <p className="text-slate-400">Pending</p>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
          <Button size="sm" variant="ghost">View All</Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No orders yet</p>
            <p className="text-slate-500 text-sm">Custom orders will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-300 font-medium">Order ID</th>
                  <th className="text-left py-3 text-slate-300 font-medium">Client</th>
                  <th className="text-left py-3 text-slate-300 font-medium">Status</th>
                  <th className="text-left py-3 text-slate-300 font-medium">Finish Date</th>
                  <th className="text-right py-3 text-slate-300 font-medium">Total</th>
                  <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/50">
                    <td className="py-4 text-white font-mono">#{order.id.slice(-8)}</td>
                    <td className="py-4">
                      <div className="text-white font-semibold">{order.clientName}</div>
                      <div className="text-slate-400 text-sm">{order.phoneNumber}</div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {new Date(order.finishDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-4 text-right text-white font-semibold">
                      {order.totalAmount.toFixed(2)} DH
                    </td>
                    <td className="py-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => alert(`Order Details:\nClient: ${order.clientName}\nPhone: ${order.phoneNumber}\nTotal: ${order.totalAmount} DH`)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};