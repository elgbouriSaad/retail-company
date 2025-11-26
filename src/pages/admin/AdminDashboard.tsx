import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, User, Phone, Package, AlertCircle, Loader2, RefreshCw, PlayCircle, DollarSign } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Order } from '../../types';
import { fetchUpcomingOrders, fetchInProgressOrders, fetchUnpaidOrders, calculateTotalPaid, fetchCustomOrders } from '../../utils/customOrderService';

export const AdminDashboard: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [upcomingOrders, setUpcomingOrders] = useState<Order[]>([]);
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // Charger les données depuis la base de données
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Charger toutes les données en parallèle
      const [upcoming, customInProgress, allCustomOrders] = await Promise.all([
        fetchUpcomingOrders(),
        fetchInProgressOrders(),
        fetchCustomOrders()
      ]);
      
      // Filtrer toutes les commandes personnalisées non payées
      const unpaidCustomOrders = allCustomOrders.filter(order => {
        const totalPaid = calculateTotalPaid(order);
        console.log(`Commande ${order.id}: Total=${order.totalAmount}, Payé=${totalPaid}, Restant=${order.totalAmount - totalPaid}`);
        return totalPaid < order.totalAmount;
      });
      
      console.log(`Total custom orders: ${allCustomOrders.length}, Unpaid: ${unpaidCustomOrders.length}`);
      
      setUpcomingOrders(upcoming);
      setInProgressOrders(customInProgress);
      setUnpaidOrders(unpaidCustomOrders);
      setAllOrders(allCustomOrders);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalOrders = allOrders.length;
  const pendingOrdersCount = allOrders.filter(o => o.status === 'pending').length;
  const inProgressOrdersCount = allOrders.filter(o => o.status === 'in-progress').length;
  const deliveredOrdersCount = allOrders.filter(o => o.status === 'delivered').length;
  
  // Calculs financiers
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRevenue = allOrders
    .filter(o => o.status === 'pending')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const completedRevenue = allOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const inProgressRevenue = allOrders
    .filter(o => o.status === 'in-progress')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Calcul du revenu mensuel (données des 6 derniers mois)
  const monthlyRevenue = [
    { month: 'Jan', revenue: 2400, orders: 12 },
    { month: 'Fév', revenue: 1800, orders: 8 },
    { month: 'Mar', revenue: 3200, orders: 15 },
    { month: 'Avr', revenue: 2800, orders: 13 },
    { month: 'Mai', revenue: 3600, orders: 18 },
    { month: 'Jui', revenue: completedRevenue, orders: deliveredOrdersCount },
  ];

  const orderStatusData = [
    { status: 'En Attente', count: pendingOrdersCount, color: 'bg-yellow-500', revenue: pendingRevenue },
    { status: 'En Cours', count: inProgressOrdersCount, color: 'bg-blue-500', revenue: inProgressRevenue },
    { status: 'Livrées', count: deliveredOrdersCount, color: 'bg-green-500', revenue: completedRevenue },
  ];

  // Calculer les jours restants avant le début
  const getDaysUntilStart = (startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tableau de Bord Admin</h1>
        <p className="text-slate-400">Aperçu de vos métriques et performances commerciales</p>
      </div>

      {/* Commandes à Venir */}
      <Card className={`${upcomingOrders.length > 0 ? 'bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/20' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className={`w-6 h-6 ${upcomingOrders.length > 0 ? 'text-orange-500' : 'text-slate-500'}`} />
            <h2 className="text-xl font-semibold text-white">Commandes à Venir (7 jours ou moins)</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {upcomingOrders.length > 0 && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                {upcomingOrders.length} commande{upcomingOrders.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {upcomingOrders.length > 0 ? (
          <div className="space-y-3">
            {upcomingOrders.map((order) => {
              const daysLeft = getDaysUntilStart(order.startDate!);
              
              return (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors cursor-pointer border border-slate-600 hover:border-orange-500/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-white font-semibold">Commande #{order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'text-green-400 bg-green-400/10' :
                          order.status === 'in-progress' ? 'text-blue-400 bg-blue-400/10' :
                          'text-yellow-400 bg-yellow-400/10'
                        }`}>
                          {order.status === 'pending' ? 'En Attente' : 
                           order.status === 'in-progress' ? 'En Cours' : 'Livrée'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <User className="w-4 h-4" />
                          <span>{order.clientName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Phone className="w-4 h-4" />
                          <span>{order.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Calendar className="w-4 h-4" />
                          <span>Début: {new Date(order.startDate!).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Package className="w-4 h-4" />
                          <span>{order.products.length} article{order.products.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold mb-1 ${
                        daysLeft <= 2 ? 'text-red-400' :
                        daysLeft <= 4 ? 'text-orange-400' :
                        'text-yellow-400'
                      }`}>
                        {daysLeft}
                      </div>
                      <div className="text-xs text-slate-400">
                        jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                      </div>
                      <div className="text-white font-semibold mt-2">
                        {order.totalAmount.toFixed(2)} DH
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Aucune commande à venir dans les 7 prochains jours</p>
            <p className="text-slate-500 text-sm mt-2">Les commandes avec statut "En Attente" et une date de début proche apparaîtront ici</p>
          </div>
        )}
      </Card>

      {/* Deux listes côte à côte : Commandes En Cours et Commandes Impayées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commandes En Cours */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <PlayCircle className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">Commandes En Cours</h2>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              {inProgressOrders.length} commande{inProgressOrders.length > 1 ? 's' : ''}
            </span>
          </div>
          {inProgressOrders.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {inProgressOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors cursor-pointer border border-slate-600 hover:border-blue-500/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">Commande #{order.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-blue-400 font-semibold">{order.totalAmount.toFixed(2)} DH</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <User className="w-4 h-4" />
                      <span>{order.clientName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Phone className="w-4 h-4" />
                      <span>{order.phoneNumber || 'N/A'}</span>
                    </div>
                    {order.finishDate && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        <span>Fin prévue: {new Date(order.finishDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Package className="w-4 h-4" />
                      <span>{order.products.length} article{order.products.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PlayCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Aucune commande en cours</p>
            </div>
          )}
        </Card>

        {/* Commandes Non Payées Complètement */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-white">Paiements Incomplets</h2>
            </div>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
              {unpaidOrders.length} commande{unpaidOrders.length > 1 ? 's' : ''}
            </span>
          </div>
          {unpaidOrders.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {unpaidOrders.map((order) => {
                const totalPaid = calculateTotalPaid(order);
                const remaining = Math.max(0, order.totalAmount - totalPaid);
                const paidPercentage = Math.min(100, (totalPaid / order.totalAmount) * 100);

                return (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors cursor-pointer border border-slate-600 hover:border-red-500/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold">Commande #{order.id.slice(0, 8)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'text-green-400 bg-green-400/10' :
                          order.status === 'in-progress' ? 'text-blue-400 bg-blue-400/10' :
                          'text-yellow-400 bg-yellow-400/10'
                        }`}>
                          {order.status === 'pending' ? 'En Attente' : 
                           order.status === 'in-progress' ? 'En Cours' : 'Livrée'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <User className="w-4 h-4" />
                        <span>{order.clientName || 'N/A'}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Payé: {totalPaid.toFixed(2)} DH</span>
                          <span className="text-red-400">Reste: {remaining.toFixed(2)} DH</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${paidPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-xs text-slate-400">
                          {paidPercentage.toFixed(0)}% payé
                        </div>
                      </div>
                      {order.paymentSchedule && order.paymentSchedule.length > 0 && (
                        <div className="text-xs text-slate-400">
                          {order.paymentSchedule.filter(p => p.status === 'pending' || p.status === 'overdue').length} paiement{order.paymentSchedule.filter(p => p.status === 'pending' || p.status === 'overdue').length > 1 ? 's' : ''} en attente
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Toutes les commandes sont payées</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique du Revenu */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Tendance du Revenu Mensuel</h2>
          <div className="space-y-4">
            {monthlyRevenue.map((month) => {
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

        {/* Statut des Commandes et Revenu */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Statut des Commandes et Revenu</h2>
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
      </div>

      {/* Modal de Détails de Commande */}
      <Modal
        isOpen={showOrderDetailsModal}
        onClose={() => setShowOrderDetailsModal(false)}
        title={`Détails de la Commande #${selectedOrder?.id || ''}`}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Informations Client */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations Client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Nom:</span>
                  <span className="text-white ml-2 font-medium">
                    {selectedOrder.clientName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Téléphone:</span>
                  <span className="text-white ml-2 font-medium">
                    {selectedOrder.phoneNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates et Statut */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Planning et Statut
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {selectedOrder.startDate && (
                  <div>
                    <span className="text-slate-400">Date de Début:</span>
                    <span className="text-white ml-2 font-medium">
                      {new Date(selectedOrder.startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {selectedOrder.finishDate && (
                  <div>
                    <span className="text-slate-400">Date de Fin:</span>
                    <span className="text-white ml-2 font-medium">
                      {new Date(selectedOrder.finishDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Statut:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    selectedOrder.status === 'delivered' ? 'text-green-400 bg-green-400/10' :
                    selectedOrder.status === 'in-progress' ? 'text-blue-400 bg-blue-400/10' :
                    'text-yellow-400 bg-yellow-400/10'
                  }`}>
                    {selectedOrder.status === 'pending' ? 'En Attente' : 
                     selectedOrder.status === 'in-progress' ? 'En Cours' : 'Livrée'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Créé le:</span>
                  <span className="text-white ml-2 font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Produits */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Articles Commandés
              </h3>
              <div className="space-y-2">
                {selectedOrder.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                    <div>
                      <p className="text-white font-medium">{product.productName}</p>
                      <p className="text-slate-400 text-sm">
                        Taille: {product.size} • Quantité: {product.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{(product.price * product.quantity).toFixed(2)} DH</p>
                      <p className="text-slate-400 text-sm">{product.price.toFixed(2)} DH / unité</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations de Paiement */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Informations de Paiement</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant Total:</span>
                  <span className="text-white font-semibold">{selectedOrder.totalAmount.toFixed(2)} DH</span>
                </div>
                {selectedOrder.downPayment !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Acompte:</span>
                    <span className="text-white font-semibold">{selectedOrder.downPayment.toFixed(2)} DH</span>
                  </div>
                )}
                {selectedOrder.advanceMoney !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avance:</span>
                    <span className="text-white font-semibold">{selectedOrder.advanceMoney.toFixed(2)} DH</span>
                  </div>
                )}
                {selectedOrder.paymentMonths !== undefined && selectedOrder.paymentMonths > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Échéancier:</span>
                    <span className="text-white font-semibold">{selectedOrder.paymentMonths} mois</span>
                  </div>
                )}
                {selectedOrder.invoiceReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Référence Facture:</span>
                    <span className="text-white font-medium">{selectedOrder.invoiceReference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Ponge */}
            {selectedOrder.pongeItems && selectedOrder.pongeItems.length > 0 && (
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Articles Ponge</h3>
                <div className="space-y-2">
                  {selectedOrder.pongeItems.map((item, idx) => (
                    <div key={item.id} className="p-2 bg-slate-800/50 rounded text-sm">
                      <span className="text-slate-400">#{idx + 1}:</span>
                      <span className="text-white ml-2">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matériaux de Référence */}
            {selectedOrder.referenceMaterials && selectedOrder.referenceMaterials.length > 0 && (
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Matériaux de Référence</h3>
                <div className="space-y-2">
                  {selectedOrder.referenceMaterials.map((material) => (
                    <div key={material.id} className="flex justify-between p-2 bg-slate-800/50 rounded text-sm">
                      <div>
                        <p className="text-white font-medium">{material.name}</p>
                        <p className="text-slate-400">{material.description}</p>
                      </div>
                      <span className="text-white">Qté: {material.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {selectedOrder.images && selectedOrder.images.length > 0 && (
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Images Attachées</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedOrder.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-slate-600"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};