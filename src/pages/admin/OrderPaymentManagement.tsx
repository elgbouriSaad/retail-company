import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Truck, CheckCircle, Clock, X, Plus, Upload, 
  Trash2, Calendar, ChevronDown, ChevronUp, DollarSign, AlertTriangle, CreditCard,
  Phone, Scissors
} from 'lucide-react';
import { mockOrders, mockUsers } from '../../data/mockData';
import { OrderForm, PongeItem, ReferenceMaterial, Order, PaymentInstallment } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import {
  generatePaymentSchedule,
  updateInstallmentStatuses,
  calculateTotalPaid,
  getNextPaymentDue,
  getOverdueInstallments,
  calculateDaysOverdue,
  recordPayment
} from '../../utils/paymentUtils';

export const OrderPaymentManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  
  const [orderForm, setOrderForm] = useState<OrderForm>({
    clientName: '',
    phoneNumber: '',
    pongeItems: [{ id: '1', description: '' }],
    referenceMaterials: [{ id: '1', name: '', description: '', quantity: 1 }],
    images: [],
    startDate: '',
    finishDate: '',
    downPayment: 0,
    advanceMoney: 0,
    paymentMonths: 1,
  });
  
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'cash' as const,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Update overdue statuses on mount and when orders change
  useEffect(() => {
    setOrders(prev => prev.map(order => {
      if (order.paymentSchedule) {
        const updatedSchedule = updateInstallmentStatuses(order.paymentSchedule);
        return { ...order, paymentSchedule: updatedSchedule };
      }
      return order;
    }));
  }, []);

  const filteredOrders = orders.filter(order => {
    const user = mockUsers.find(u => u.id === order.userId);
    const matchesSearch = order.id.includes(searchTerm) ||
                         order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products.some(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Get all orders with overdue payments
  const ordersWithOverduePayments = orders.filter(order => {
    if (!order.paymentSchedule) return false;
    const overdueInst = getOverdueInstallments(order.paymentSchedule);
    return overdueInst.length > 0;
  });

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  const handleStartProcessing = (orderId: string) => {
    if (confirm('Confirmer le démarrage du traitement de cette commande ?')) {
      handleStatusUpdate(orderId, 'in-progress');
      alert('✓ Commande mise en cours de traitement.');
    }
  };

  const handleMarkDelivered = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check payment status before marking as delivered
    const totalPaidFromSchedule = order.paymentSchedule ? calculateTotalPaid(order.paymentSchedule) : 0;
    const totalRemaining = order.totalAmount - totalPaidFromSchedule;
    
    let confirmMsg = 'Marquer cette commande comme livrée ?\n\n';
    
    if (totalRemaining > 0) {
      confirmMsg += `⚠️ ATTENTION: Il reste ${totalRemaining.toFixed(2)} DH à payer.\n\n`;
      const unpaidCount = order.paymentSchedule?.filter(inst => inst.status !== 'paid').length || 0;
      if (unpaidCount > 0) {
        confirmMsg += `${unpaidCount} échéance${unpaidCount > 1 ? 's' : ''} impayée${unpaidCount > 1 ? 's' : ''}.\n\n`;
      }
      confirmMsg += 'Voulez-vous quand même marquer comme livrée ?';
    } else {
      confirmMsg += '✓ Tous les paiements sont complets.';
    }
    
    if (confirm(confirmMsg)) {
      handleStatusUpdate(orderId, 'delivered');
      alert('✓ Commande marquée comme livrée.');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check if there are any payments made
    const hasPaidInstallments = order.paymentSchedule?.some(inst => inst.status === 'paid') || false;
    
    let confirmMsg = '⚠️ Êtes-vous sûr de vouloir supprimer cette commande ?\n\n';
    confirmMsg += `Client: ${order.clientName}\n`;
    confirmMsg += `Commande #${orderId.slice(-6)}\n`;
    
    if (hasPaidInstallments) {
      const totalPaidFromSchedule = order.paymentSchedule ? calculateTotalPaid(order.paymentSchedule) : 0;
      confirmMsg += `\n⚠️ ATTENTION: Des paiements ont été enregistrés (${totalPaidFromSchedule.toFixed(2)} DH).\n`;
    }
    
    confirmMsg += '\n❌ Cette action ne peut pas être annulée.';
    
    if (confirm(confirmMsg)) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      alert('✓ Commande supprimée avec succès.');
    }
  };

  const canAdvanceStatus = (status: string) => {
    return status === 'pending' || status === 'in-progress';
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

  const getPaymentStatusColor = (status: PaymentInstallment['status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-400/10';
      case 'overdue':
        return 'text-red-400 bg-red-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  // Ponge item management
  const addPongeItem = () => {
    const newItem: PongeItem = {
      id: Date.now().toString(),
      description: '',
    };
    setOrderForm(prev => ({
      ...prev,
      pongeItems: [...prev.pongeItems, newItem],
    }));
  };

  const removePongeItem = (id: string) => {
    setOrderForm(prev => ({
      ...prev,
      pongeItems: prev.pongeItems.filter(item => item.id !== id),
    }));
  };

  const updatePongeItem = (id: string, field: keyof PongeItem, value: string) => {
    setOrderForm(prev => ({
      ...prev,
      pongeItems: prev.pongeItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Reference material management
  const addReferenceMaterial = () => {
    const newMaterial: ReferenceMaterial = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
    };
    setOrderForm(prev => ({
      ...prev,
      referenceMaterials: [...prev.referenceMaterials, newMaterial],
    }));
  };

  const removeReferenceMaterial = (id: string) => {
    setOrderForm(prev => ({
      ...prev,
      referenceMaterials: prev.referenceMaterials.filter(material => material.id !== id),
    }));
  };

  const updateReferenceMaterial = (id: string, field: keyof ReferenceMaterial, value: string | number) => {
    setOrderForm(prev => ({
      ...prev,
      referenceMaterials: prev.referenceMaterials.map(material =>
        material.id === id ? { ...material, [field]: value } : material
      ),
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setOrderForm(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray],
      }));

      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImages(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setOrderForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = () => {
    // Validation 1: Required fields
    if (!orderForm.clientName || !orderForm.phoneNumber) {
      alert('⚠️ Erreur: Veuillez entrer le nom du client et le numéro de téléphone.');
      return;
    }

    // Validation 2: At least one Ponge item
    if (orderForm.pongeItems.length === 0 || !orderForm.pongeItems[0].description) {
      alert('⚠️ Erreur: Veuillez ajouter au moins un article Ponge avec une description.');
      return;
    }

    // Validation 3: Finish date must be set
    if (!orderForm.finishDate) {
      alert('⚠️ Erreur: Veuillez définir une date de fin.');
      return;
    }

    // Validation 4: Payment months must be valid
    if (orderForm.paymentMonths < 1) {
      alert('⚠️ Erreur: Le nombre de mois de paiement doit être au moins 1.');
      return;
    }

    // Validation 5: If there's advance money, there must be payment months
    if (orderForm.advanceMoney > 0 && orderForm.paymentMonths < 1) {
      alert('⚠️ Erreur: Si vous ajoutez une avance, vous devez définir au moins 1 mois de paiement.');
      return;
    }

    // Validation 6: Down payment + advance should make sense
    if (orderForm.downPayment < 0 || orderForm.advanceMoney < 0) {
      alert('⚠️ Erreur: L\'acompte et l\'avance ne peuvent pas être négatifs.');
      return;
    }

    // Determine status based on start date
    let orderStatus: 'pending' | 'in-progress' = 'pending';
    if (orderForm.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(orderForm.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate.getTime() === today.getTime()) {
        orderStatus = 'in-progress';
      }
    }
    
    // Calculate total amount - acompte is the TOTAL amount of the contract
    const totalAmount = orderForm.downPayment;
    
    // Validation 7: Total amount should be positive if there are payment terms
    if (totalAmount <= 0 && orderForm.paymentMonths > 0) {
      if (!confirm('⚠️ Attention: Aucun montant total (acompte) n\'a été défini.\n\nVoulez-vous créer cette commande sans paiements ?')) {
        return;
      }
    }
    
    // Validation 8: Advance money cannot exceed total amount
    if (orderForm.advanceMoney > totalAmount) {
      alert(`⚠️ Erreur: L'avance (${orderForm.advanceMoney.toFixed(2)} DH) ne peut pas dépasser le montant total (${totalAmount.toFixed(2)} DH).`);
      return;
    }
    
    // Generate payment schedule
    // The avance is the FIRST payment, included in the total amount
    const paymentSchedule = generatePaymentSchedule(
      orderForm.startDate,
      totalAmount,
      0, // No separate down payment, it's all in totalAmount
      orderForm.advanceMoney,
      orderForm.paymentMonths
    );
    
    const newOrder: Order = {
      id: Date.now().toString(),
      userId: 'admin-created',
      products: orderForm.pongeItems.map(item => ({
        productId: item.id,
        productName: item.description,
        quantity: 1,
        size: 'Ponge',
        price: 0,
      })),
      status: orderStatus,
      totalAmount: totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientName: orderForm.clientName,
      phoneNumber: orderForm.phoneNumber,
      pongeItems: orderForm.pongeItems,
      referenceMaterials: orderForm.referenceMaterials,
      startDate: orderForm.startDate,
      finishDate: orderForm.finishDate,
      downPayment: orderForm.downPayment,
      advanceMoney: orderForm.advanceMoney,
      paymentMonths: orderForm.paymentMonths,
      images: uploadedImages,
      invoiceReference: `INV-${Date.now()}`,
      paymentSchedule: paymentSchedule,
    };

    setOrders(prev => [...prev, newOrder]);
    
    // Success message with detailed summary
    const scheduleCount = paymentSchedule.length;
    let summaryMsg = `✓ Commande créée avec succès !\n\n`;
    summaryMsg += `📋 RÉSUMÉ DE LA COMMANDE\n`;
    summaryMsg += `${'='.repeat(30)}\n\n`;
    summaryMsg += `👤 Client: ${orderForm.clientName}\n`;
    summaryMsg += `📱 Téléphone: ${orderForm.phoneNumber}\n`;
    summaryMsg += `📦 Articles Ponge: ${orderForm.pongeItems.length}\n`;
    summaryMsg += `💰 Montant Total (Acompte): ${totalAmount.toFixed(2)} DH\n`;
    if (orderForm.advanceMoney > 0) {
      summaryMsg += `✓ Avance payée (1er mois): ${orderForm.advanceMoney.toFixed(2)} DH\n`;
      summaryMsg += `📉 Restant à payer: ${(totalAmount - orderForm.advanceMoney).toFixed(2)} DH\n`;
      summaryMsg += `💳 Mensualités suivantes: ${((totalAmount - orderForm.advanceMoney) / (orderForm.paymentMonths - 1)).toFixed(2)} DH × ${orderForm.paymentMonths - 1} mois\n`;
    } else {
      summaryMsg += `📉 À payer: ${totalAmount.toFixed(2)} DH\n`;
    }
    summaryMsg += `📅 Total Échéances: ${scheduleCount} paiement${scheduleCount > 1 ? 's' : ''}\n`;
    summaryMsg += `📌 Statut: ${orderStatus === 'in-progress' ? 'En Cours' : 'En Attente'}\n`;
    if (orderForm.startDate) {
      summaryMsg += `🗓️ Date de début: ${new Date(orderForm.startDate).toLocaleDateString('fr-FR')}`;
    }
    
    alert(summaryMsg);
    
    setShowCreateOrderModal(false);
    
    // Reset form
    setOrderForm({
      clientName: '',
      phoneNumber: '',
      pongeItems: [{ id: '1', description: '' }],
      referenceMaterials: [{ id: '1', name: '', description: '', quantity: 1 }],
      images: [],
      startDate: '',
      finishDate: '',
      downPayment: 0,
      advanceMoney: 0,
      paymentMonths: 1,
    });
    setUploadedImages([]);
  };

  const handleAddPayment = () => {
    if (!selectedOrderForPayment || !selectedInstallment) return;
    
    // Validation 1: Check for valid amount
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      alert('⚠️ Erreur: Veuillez entrer un montant valide supérieur à 0.');
      return;
    }

    // Validation 2: Check if installment is already paid
    if (selectedInstallment.status === 'paid') {
      alert('⚠️ Erreur: Cette échéance a déjà été payée.');
      return;
    }

    // Validation 3: Check payment date is not in the future
    const paymentDate = new Date(paymentForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);
    
    if (paymentDate > today) {
      if (!confirm(`⚠️ Attention: La date de paiement (${new Date(paymentForm.date).toLocaleDateString('fr-FR')}) est dans le futur.\n\nVoulez-vous vraiment enregistrer ce paiement avec une date future ?`)) {
        return;
      }
    }

    // Validation 4: Prevent overpayment - amount cannot exceed installment amount
    if (paymentForm.amount > selectedInstallment.amount) {
      alert(`⚠️ Erreur: Le montant saisi (${paymentForm.amount.toFixed(2)} DH) dépasse le montant de l'échéance (${selectedInstallment.amount.toFixed(2)} DH).\n\nVeuillez ajuster le montant.`);
      return;
    }

    // Validation 5: Partial payment warning
    if (paymentForm.amount < selectedInstallment.amount) {
      const difference = selectedInstallment.amount - paymentForm.amount;
      if (!confirm(`⚠️ Attention: Vous payez ${paymentForm.amount.toFixed(2)} DH sur ${selectedInstallment.amount.toFixed(2)} DH.\n\nIl manquera ${difference.toFixed(2)} DH pour cette échéance.\n\nVoulez-vous continuer ?`)) {
        return;
      }
    }

    // Validation 6: Confirm payment
    if (!confirm(`✓ Confirmer le paiement de ${paymentForm.amount.toFixed(2)} DH ?\n\nClient: ${selectedOrderForPayment.clientName}\nMéthode: ${
      paymentForm.method === 'cash' ? 'Espèces' :
      paymentForm.method === 'card' ? 'Carte' :
      paymentForm.method === 'check' ? 'Chèque' :
      paymentForm.method === 'transfer' ? 'Virement' :
      'Paiement Mobile'
    }\nDate: ${new Date(paymentForm.date).toLocaleDateString('fr-FR')}`)) {
      return;
    }

    // Track if status will change to delivered
    let willBeDelivered = false;

    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrderForPayment.id && order.paymentSchedule) {
        const updatedSchedule = recordPayment(
          order.paymentSchedule,
          selectedInstallment.id,
          paymentForm.amount,
          paymentForm.method,
          paymentForm.date,
          paymentForm.notes
        );
        
        // Check if all installments are now paid
        const allPaid = updatedSchedule.every(inst => inst.status === 'paid');
        
        // Calculate if total amount is fully paid
        const totalPaidFromSchedule = calculateTotalPaid(updatedSchedule);
        const fullyPaid = order.totalAmount > 0 && totalPaidFromSchedule >= order.totalAmount;
        
        // Auto-update order status to delivered if fully paid
        const newStatus = (allPaid || fullyPaid) ? 'delivered' : order.status;
        
        if (newStatus === 'delivered' && order.status !== 'delivered') {
          willBeDelivered = true;
        }
        
        return {
          ...order,
          paymentSchedule: updatedSchedule,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return order;
    }));

    // Build success message with remaining balance info
    const updatedOrder = orders.find(o => o.id === selectedOrderForPayment.id);
    if (updatedOrder && updatedOrder.paymentSchedule) {
      // Simulate the updated schedule to calculate remaining
      const simulatedSchedule = recordPayment(
        updatedOrder.paymentSchedule,
        selectedInstallment.id,
        paymentForm.amount,
        paymentForm.method,
        paymentForm.date,
        paymentForm.notes
      );
      const remainingInstallments = simulatedSchedule.filter(inst => inst.status !== 'paid').length;
      const totalPaidNow = calculateTotalPaid(simulatedSchedule);
      const totalRemaining = updatedOrder.totalAmount - totalPaidNow;
      
      let successMsg = `✓ Paiement enregistré avec succès !\n\n`;
      successMsg += `💰 Montant payé: ${paymentForm.amount.toFixed(2)} DH\n`;
      successMsg += `📊 Total payé: ${totalPaidNow.toFixed(2)} DH\n`;
      successMsg += `📉 Restant: ${totalRemaining.toFixed(2)} DH\n`;
      
      if (remainingInstallments > 0) {
        successMsg += `\n📅 Échéances restantes: ${remainingInstallments}`;
      } else {
        successMsg += `\n🎉 Toutes les échéances sont payées !`;
      }

      if (willBeDelivered) {
        successMsg += `\n\n✓ Statut changé automatiquement à "Livrée"`;
      }
      
      alert(successMsg);
    } else {
      alert(`✓ Paiement de ${paymentForm.amount.toFixed(2)} DH enregistré avec succès !`);
    }
    
    setShowPaymentModal(false);
    setPaymentForm({
      amount: 0,
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const openPaymentModal = (order: Order, installment?: PaymentInstallment) => {
    // Validation: Check if order is already fully paid
    if (order.paymentSchedule) {
      const allPaid = order.paymentSchedule.every(inst => inst.status === 'paid');
      if (allPaid) {
        alert('✓ Information: Cette commande est déjà entièrement payée.\n\nToutes les échéances ont été réglées.');
        return;
      }
    }

    // Validation: Check if there are any unpaid installments
    const unpaidInstallments = order.paymentSchedule?.filter(inst => inst.status !== 'paid') || [];
    if (unpaidInstallments.length === 0) {
      alert('✓ Information: Tous les paiements ont été effectués pour cette commande.');
      return;
    }

    setSelectedOrderForPayment(order);
    
    if (installment) {
      // Check if this specific installment is already paid
      if (installment.status === 'paid') {
        alert('✓ Information: Cette échéance a déjà été payée.');
        return;
      }
      
      setSelectedInstallment(installment);
      setPaymentForm(prev => ({
        ...prev,
        amount: installment.amount
      }));
    } else {
      // Get next unpaid installment
      const nextDue = order.paymentSchedule ? getNextPaymentDue(order.paymentSchedule) : null;
      if (nextDue) {
        setSelectedInstallment(nextDue);
        setPaymentForm(prev => ({
          ...prev,
          amount: nextDue.amount
        }));
      } else {
        alert('✓ Information: Aucune échéance de paiement en attente.');
        return;
      }
    }
    
    setShowPaymentModal(true);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Commandes et Paiements</h1>
          <p className="text-slate-400">Suivez vos commandes et gérez les paiements</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateOrderModal(true)}>
          Créer une Commande
        </Button>
      </div>

      {/* Overdue Payments Alert Section */}
      {ordersWithOverduePayments.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/20 to-red-600/10 border-2 border-red-500/40 shadow-xl shadow-red-500/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400">
                ⚠ Paiements en Retard ({ordersWithOverduePayments.length})
              </h3>
              <p className="text-red-300 text-sm">Action requise - Ces commandes ont des paiements en retard</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {ordersWithOverduePayments.map(order => {
              const overdueInst = getOverdueInstallments(order.paymentSchedule || []);
              const totalOverdue = overdueInst.reduce((sum, inst) => sum + inst.amount, 0);
              const oldestOverdue = overdueInst[0];
              const daysLate = oldestOverdue ? calculateDaysOverdue(oldestOverdue.dueDate) : 0;
              
              return (
                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-700/70 rounded-xl border border-red-500/30 hover:bg-slate-700 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-red-400 font-bold text-lg">{daysLate}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{order.clientName}</p>
                      <p className="text-red-400 font-semibold text-sm flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {totalOverdue.toFixed(2)} DH en retard
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Commande #{order.id.slice(-6)} • {daysLate} jour{daysLate > 1 ? 's' : ''} de retard
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={DollarSign}
                    onClick={() => openPaymentModal(order, oldestOverdue)}
                  >
                    Enregistrer Paiement
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all">
          <Package className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white mb-1">{orders.length}</p>
          <p className="text-slate-400 text-sm">Total Commandes</p>
        </Card>

        <Card className="text-center bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-500/40 transition-all">
          <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white mb-1">
            {orders.filter(o => o.status === 'pending').length}
          </p>
          <p className="text-slate-400 text-sm">En Attente</p>
        </Card>

        <Card className="text-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all">
          <Truck className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white mb-1">
            {orders.filter(o => o.status === 'in-progress').length}
          </p>
          <p className="text-slate-400 text-sm">En Cours</p>
        </Card>

        <Card className="text-center bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white mb-1">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
          <p className="text-slate-400 text-sm">Livrées</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher des commandes..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={Search}
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les Statuts</option>
            <option value="pending">En Attente</option>
            <option value="in-progress">En Cours</option>
            <option value="delivered">Livrées</option>
          </select>

          <div className="text-slate-300 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            {filteredOrders.length} commandes
          </div>
        </div>
      </Card>

      {/* Orders Table with Expandable Payment Details */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-300 font-medium w-8"></th>
                <th className="text-left py-3 text-slate-300 font-medium">Commande #</th>
                <th className="text-left py-3 text-slate-300 font-medium">Client</th>
                <th className="text-left py-3 text-slate-300 font-medium">Articles</th>
                <th className="text-left py-3 text-slate-300 font-medium">Montant Total</th>
                <th className="text-left py-3 text-slate-300 font-medium">Payé</th>
                <th className="text-left py-3 text-slate-300 font-medium">Restant</th>
                <th className="text-left py-3 text-slate-300 font-medium">Prochain Paiement</th>
                <th className="text-left py-3 text-slate-300 font-medium">Statut</th>
                <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const user = mockUsers.find(u => u.id === order.userId);
                const isExpanded = expandedOrderId === order.id;
                // Calculate payment totals including down payment
                // Calculate payment totals
                // Note: downPayment is the TOTAL amount, advanceMoney is first installment (part of total)
                const totalPaidFromSchedule = order.paymentSchedule ? calculateTotalPaid(order.paymentSchedule) : 0;
                const totalPaid = totalPaidFromSchedule;
                const totalRemaining = order.totalAmount > 0 ? order.totalAmount - totalPaid : 0;
                const nextPayment = order.paymentSchedule ? getNextPaymentDue(order.paymentSchedule) : null;
                const paymentProgress = order.totalAmount > 0 ? (totalPaid / order.totalAmount) * 100 : 0;
                
                return (
                  <React.Fragment key={order.id}>
                    <tr 
                      className="border-b border-slate-700/50 hover:bg-slate-700/40 cursor-pointer transition-colors"
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <td className="py-4 px-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-blue-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </td>
                      <td className="py-4 text-blue-400 font-mono font-semibold">#{order.id.slice(-6)}</td>
                      <td className="py-4">
                        <div>
                          <p className="text-white font-semibold text-base">{order.clientName || user?.name || 'Utilisateur Inconnu'}</p>
                          <p className="text-slate-400 text-sm flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.phoneNumber || user?.phone || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-slate-300">{order.pongeItems?.length || order.products.length}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-white font-bold text-base">
                          {order.totalAmount > 0 ? `${order.totalAmount.toFixed(2)} DH` : '—'}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-green-400 font-semibold">{totalPaid.toFixed(2)} DH</p>
                          {order.totalAmount > 0 && (
                            <div className="w-24 bg-slate-600 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-green-400 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-slate-400">{Math.round(paymentProgress)}%</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className={`font-semibold ${totalRemaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                          {totalRemaining.toFixed(2)} DH
                        </p>
                      </td>
                      <td className="py-4">
                        {nextPayment ? (
                          <div className={`inline-flex flex-col p-2 rounded-lg ${
                            nextPayment.status === 'overdue' 
                              ? 'bg-red-500/20 border border-red-500/30' 
                              : 'bg-slate-700'
                          }`}>
                            <p className={`text-sm font-semibold ${
                              nextPayment.status === 'overdue' ? 'text-red-400' : 'text-white'
                            }`}>
                              {new Date(nextPayment.dueDate).toLocaleDateString('fr-FR')}
                            </p>
                            {nextPayment.status === 'overdue' && (
                              <p className="text-xs text-red-400 font-medium flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {calculateDaysOverdue(nextPayment.dueDate)}j de retard
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-green-400 text-sm font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Tout payé
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1.5">
                              {order.status === 'pending' && 'En Attente'}
                              {order.status === 'in-progress' && 'En Cours'}
                              {order.status === 'delivered' && 'Livrée'}
                            </span>
                          </span>
                          {order.status === 'delivered' && totalRemaining <= 0 && (
                            <div className="text-xs text-green-400 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Payé
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {nextPayment && nextPayment.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant={nextPayment.status === 'overdue' ? "danger" : "primary"}
                              icon={DollarSign}
                              onClick={() => openPaymentModal(order, nextPayment)}
                            >
                              Payer
                            </Button>
                          )}
                          {canAdvanceStatus(order.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (order.status === 'pending') {
                                  handleStartProcessing(order.id);
                                } else {
                                  handleMarkDelivered(order.id);
                                }
                              }}
                            >
                              {order.status === 'pending' ? 'Démarrer' : 'Livrer'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr className="bg-gradient-to-r from-slate-700/50 to-slate-700/30 border-l-4 border-blue-500">
                        <td colSpan={10} className="py-6 px-8">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Order Details */}
                            <div className="space-y-4">
                              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <h4 className="text-white font-semibold mb-4 flex items-center">
                                  <Package className="w-5 h-5 mr-2 text-blue-400" />
                                  Détails de la Commande
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                                    <span className="text-slate-400">Client:</span>
                                    <span className="text-white font-semibold">{order.clientName}</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                                    <span className="text-slate-400">Téléphone:</span>
                                    <span className="text-white">{order.phoneNumber}</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-600">
                                    <span className="text-slate-400">Date Début:</span>
                                    <span className="text-white">
                                      {order.startDate ? new Date(order.startDate).toLocaleDateString('fr-FR') : '—'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Date Fin:</span>
                                    <span className="text-white">
                                      {order.finishDate ? new Date(order.finishDate).toLocaleDateString('fr-FR') : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {order.pongeItems && order.pongeItems.length > 0 && (
                                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                  <h4 className="text-white font-semibold mb-3 flex items-center">
                                    <Scissors className="w-5 h-5 mr-2 text-green-400" />
                                    Articles Ponge
                                  </h4>
                                  <div className="space-y-2">
                                    {order.pongeItems.map((item, idx) => (
                                      <div key={idx} className="text-sm text-white p-3 bg-slate-600/50 rounded-lg border border-slate-500">
                                        <span className="text-slate-400 mr-2">{idx + 1}.</span>
                                        {item.description}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {order.referenceMaterials && order.referenceMaterials.length > 0 && (
                                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                  <h4 className="text-white font-semibold mb-3">Matériaux de Référence</h4>
                                  <div className="space-y-2">
                                    {order.referenceMaterials.map((material, idx) => (
                                      <div key={idx} className="text-sm text-slate-300 p-2 bg-slate-600/50 rounded flex justify-between">
                                        <span>{material.name}</span>
                                        <span className="text-slate-400">Qté: {material.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right: Payment Schedule */}
                            <div className="space-y-4">
                              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-white font-semibold flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2 text-green-400" />
                                    Échéancier de Paiement
                                  </h4>
                                  <Button
                                    size="sm"
                                    icon={Plus}
                                    onClick={() => openPaymentModal(order)}
                                  >
                                    Paiement
                                  </Button>
                                </div>

                                {order.paymentSchedule && order.paymentSchedule.length > 0 ? (
                                  <div className="space-y-4">
                                    {/* Payment summary */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                                        <p className="text-xs text-blue-400 mb-1">Total</p>
                                        <p className="text-white font-bold">{(order.totalAmount || 0).toFixed(2)} DH</p>
                                      </div>
                                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                        <p className="text-xs text-green-400 mb-1">Payé</p>
                                        <p className="text-white font-bold">{totalPaid.toFixed(2)} DH</p>
                                      </div>
                                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
                                        <p className="text-xs text-orange-400 mb-1">Restant</p>
                                        <p className="text-white font-bold">{totalRemaining.toFixed(2)} DH</p>
                                      </div>
                                    </div>

                                    {/* Payment schedule list */}
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                      {order.paymentSchedule.map((installment, idx) => (
                                        <div
                                          key={installment.id}
                                          className={`p-4 rounded-xl border-2 transition-all ${
                                            installment.status === 'paid'
                                              ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10'
                                              : installment.status === 'overdue'
                                              ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/10 animate-pulse'
                                              : 'bg-slate-700/80 border-slate-500 hover:border-blue-500/50'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-2">
                                                {installment.status === 'paid' && (
                                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                                )}
                                                {installment.status === 'overdue' && (
                                                  <AlertTriangle className="w-5 h-5 text-red-400" />
                                                )}
                                                {installment.status === 'pending' && (
                                                  <Clock className="w-5 h-5 text-yellow-400" />
                                                )}
                                                <p className="text-white font-semibold">
                                                  Échéance {idx + 1}
                                                  {idx === 0 && order.advanceMoney && order.advanceMoney > 0 ? ' (Avance)' : ''}
                                                </p>
                                              </div>
                                              
                                              <div className="space-y-1 ml-7">
                                                <div className="flex items-center text-xs">
                                                  <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                                  <span className="text-slate-400">Échéance: </span>
                                                  <span className={`ml-1 font-medium ${
                                                    installment.status === 'overdue' ? 'text-red-400' : 'text-white'
                                                  }`}>
                                                    {new Date(installment.dueDate).toLocaleDateString('fr-FR', { 
                                                      day: '2-digit', 
                                                      month: 'long', 
                                                      year: 'numeric' 
                                                    })}
                                                  </span>
                                                </div>
                                                
                                                {installment.status === 'paid' && installment.paidDate && (
                                                  <div className="flex items-center text-xs">
                                                    <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
                                                    <span className="text-green-400">
                                                      Payé le {new Date(installment.paidDate).toLocaleDateString('fr-FR')}
                                                    </span>
                                                  </div>
                                                )}
                                                
                                                {installment.status === 'overdue' && (
                                                  <div className="flex items-center text-xs">
                                                    <AlertTriangle className="w-3 h-3 mr-1 text-red-400" />
                                                    <span className="text-red-400 font-semibold">
                                                      {calculateDaysOverdue(installment.dueDate)} jours de retard
                                                    </span>
                                                  </div>
                                                )}

                                                {installment.method && (
                                                  <div className="text-xs text-slate-400">
                                                    Méthode: {
                                                      installment.method === 'cash' ? 'Espèces' :
                                                      installment.method === 'card' ? 'Carte' :
                                                      installment.method === 'check' ? 'Chèque' :
                                                      installment.method === 'transfer' ? 'Virement' :
                                                      'Paiement Mobile'
                                                    }
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div className="text-right flex flex-col items-end space-y-2">
                                              <p className="text-white font-bold text-lg">
                                                {(installment.paidAmount || installment.amount).toFixed(2)} DH
                                              </p>
                                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusColor(installment.status)}`}>
                                                {installment.status === 'paid' && '✓ Payé'}
                                                {installment.status === 'pending' && '○ En Attente'}
                                                {installment.status === 'overdue' && '⚠ En Retard'}
                                              </span>
                                              
                                              {installment.status !== 'paid' && (
                                                <Button
                                                  size="sm"
                                                  variant={installment.status === 'overdue' ? "danger" : "primary"}
                                                  onClick={() => openPaymentModal(order, installment)}
                                                  className="w-full"
                                                >
                                                  <DollarSign className="w-4 h-4 mr-1" />
                                                  Payer Maintenant
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-sm text-center py-8">Aucun échéancier de paiement</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        title="Créer une Nouvelle Commande"
        size="xl"
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du Client"
              value={orderForm.clientName}
              onChange={(value) => setOrderForm(prev => ({ ...prev, clientName: value }))}
              placeholder="Entrez le nom du client"
              required
            />
            <Input
              label="Numéro de Téléphone"
              value={orderForm.phoneNumber}
              onChange={(value) => setOrderForm(prev => ({ ...prev, phoneNumber: value }))}
              placeholder="Entrez le numéro de téléphone"
              required
            />
          </div>

          {/* Ponge Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Articles Ponge</h4>
              <Button size="sm" onClick={addPongeItem} icon={Plus}>
                Ajouter un Ponge
              </Button>
            </div>
            <div className="space-y-3">
              {orderForm.pongeItems.map((item) => (
                <div key={item.id} className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        label="Description"
                        value={item.description}
                        onChange={(value) => updatePongeItem(item.id, 'description', value)}
                        placeholder="Description du Ponge"
                        required
                      />
                    </div>
                    {orderForm.pongeItems.length > 1 && (
                      <div className="flex items-end">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removePongeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Materials */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Matériaux de Référence</h4>
              <Button size="sm" onClick={addReferenceMaterial} icon={Plus}>
                Ajouter un Matériau
              </Button>
            </div>
            <div className="space-y-3">
              {orderForm.referenceMaterials.map((material) => (
                <div key={material.id} className="p-4 bg-slate-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Nom du Matériau"
                      value={material.name}
                      onChange={(value) => updateReferenceMaterial(material.id, 'name', value)}
                      placeholder="Nom du matériau"
                    />
                    <Input
                      label="Description"
                      value={material.description}
                      onChange={(value) => updateReferenceMaterial(material.id, 'description', value)}
                      placeholder="Description du matériau"
                    />
                    <div className="flex items-end space-x-2">
                      <Input
                        label="Quantité"
                        type="number"
                        value={material.quantity.toString()}
                        onChange={(value) => updateReferenceMaterial(material.id, 'quantity', parseInt(value) || 0)}
                        min="1"
                      />
                      {orderForm.referenceMaterials.length > 1 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeReferenceMaterial(material.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h4 className="text-white font-semibold mb-4">Télécharger des Images</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold">Cliquez pour télécharger</span> ou glisser-déposer
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF jusqu'à 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        className="absolute top-1 right-1"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date de Début (Optionnelle)"
              type="date"
              icon={Calendar}
              value={orderForm.startDate}
              onChange={(value) => setOrderForm(prev => ({ ...prev, startDate: value }))}
            />
            <Input
              label="Date de Fin"
              type="date"
              icon={Calendar}
              value={orderForm.finishDate}
              onChange={(value) => setOrderForm(prev => ({ ...prev, finishDate: value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="💰 Acompte (Montant Total du Contrat)"
                type="number"
                step="0.01"
                value={orderForm.downPayment.toString()}
                onChange={(value) => setOrderForm(prev => ({ ...prev, downPayment: parseFloat(value) || 0 }))}
                placeholder="Ex: 5000.00"
                min="0"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Le montant total que le client doit payer</p>
            </div>
            <div>
              <Input
                label="✓ Avance Payée (1er Mois)"
                type="number"
                step="0.01"
                value={orderForm.advanceMoney.toString()}
                onChange={(value) => setOrderForm(prev => ({ ...prev, advanceMoney: parseFloat(value) || 0 }))}
                placeholder="Ex: 1000.00"
                min="0"
                max={orderForm.downPayment.toString()}
              />
              <p className="text-xs text-slate-400 mt-1">Premier paiement déjà effectué (inclus dans le total)</p>
              {orderForm.advanceMoney > orderForm.downPayment && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  L'avance ne peut pas dépasser le total
                </p>
              )}
            </div>
            <div>
              <Input
                label="Mois de Paiement"
                type="number"
                value={orderForm.paymentMonths.toString()}
                onChange={(value) => setOrderForm(prev => ({ ...prev, paymentMonths: parseInt(value) || 1 }))}
                min="1"
                max="24"
              />
              <p className="text-xs text-slate-400 mt-1">Nombre total de mois (incluant l'avance)</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-400" />
              Récapitulatif des Paiements
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                <span className="text-slate-400">📦 Articles Ponge:</span>
                <span className="text-white font-semibold">
                  {orderForm.pongeItems.length} article(s)
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                <span className="text-slate-400">💰 Montant Total (Acompte):</span>
                <span className="text-white font-bold text-lg">{orderForm.downPayment.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-500/10 rounded border border-green-500/20">
                <span className="text-green-400 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  ✓ Avance Payée (1er Mois):
                </span>
                <span className="text-green-400 font-semibold">{orderForm.advanceMoney.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded border-t-2 border-slate-600 mt-2 pt-3">
                <span className="text-orange-400 font-semibold">📉 Restant à Payer:</span>
                <span className="text-orange-400 font-bold text-lg">
                  {(orderForm.downPayment - orderForm.advanceMoney).toFixed(2)} DH
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-700/50 rounded mt-2">
                <span className="text-slate-400">📅 Durée Totale:</span>
                <span className="text-white">{orderForm.paymentMonths} mois</span>
              </div>
              {orderForm.paymentMonths > 1 && orderForm.downPayment > orderForm.advanceMoney && (
                <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded border border-blue-500/20">
                  <span className="text-blue-400">💳 Paiement Mensuel (mois 2 à {orderForm.paymentMonths}):</span>
                  <span className="text-blue-400 font-bold">
                    {((orderForm.downPayment - orderForm.advanceMoney) / (orderForm.paymentMonths - 1)).toFixed(2)} DH/mois
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-6 border-t border-slate-700">
          <Button onClick={handleCreateOrder}>
            Créer la Commande
          </Button>
          <Button variant="secondary" onClick={() => setShowCreateOrderModal(false)}>
            Annuler
          </Button>
        </div>
      </Modal>

      {/* Payment Recording Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="💳 Enregistrer un Paiement"
        size="md"
      >
        <div className="space-y-5">
          {selectedOrderForPayment && (
            <div className="p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-400 text-xs font-semibold mb-1">COMMANDE</p>
              <p className="text-white font-bold text-lg">{selectedOrderForPayment.clientName}</p>
              <p className="text-slate-300 text-sm flex items-center mt-1">
                <Phone className="w-3 h-3 mr-1" />
                {selectedOrderForPayment.phoneNumber}
              </p>
              <p className="text-slate-400 text-xs mt-2">#{selectedOrderForPayment.id.slice(-6)}</p>
            </div>
          )}

          {selectedInstallment && (
            <div className={`p-4 border-2 rounded-xl ${
              selectedInstallment.status === 'overdue'
                ? 'bg-red-500/10 border-red-500/40'
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              <p className={`text-sm font-semibold mb-2 flex items-center ${
                selectedInstallment.status === 'overdue' ? 'text-red-400' : 'text-green-400'
              }`}>
                <Calendar className="w-4 h-4 mr-2" />
                Échéance: {new Date(selectedInstallment.dueDate).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-white font-bold text-2xl">{selectedInstallment.amount.toFixed(2)} DH</p>
              {selectedInstallment.status === 'overdue' && (
                <p className="text-red-400 text-xs mt-2 flex items-center font-semibold">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {calculateDaysOverdue(selectedInstallment.dueDate)} jours de retard
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              💰 Montant à Payer
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={paymentForm.amount.toString()}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                max={selectedInstallment?.amount.toString()}
                className={`w-full px-4 py-3 bg-slate-700 border-2 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 ${
                  selectedInstallment && paymentForm.amount > selectedInstallment.amount
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-600 focus:ring-green-500 focus:border-green-500'
                }`}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">DH</span>
            </div>
            {selectedInstallment && paymentForm.amount > selectedInstallment.amount && (
              <p className="text-red-400 text-xs mt-2 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                ⚠️ Le montant dépasse l'échéance de {selectedInstallment.amount.toFixed(2)} DH
              </p>
            )}
            {selectedInstallment && paymentForm.amount < selectedInstallment.amount && paymentForm.amount > 0 && (
              <p className="text-yellow-400 text-xs mt-2 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Paiement partiel - Reste: {(selectedInstallment.amount - paymentForm.amount).toFixed(2)} DH
              </p>
            )}
            {selectedInstallment && paymentForm.amount === selectedInstallment.amount && (
              <p className="text-green-400 text-xs mt-2 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                ✓ Montant correct pour cette échéance
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              💳 Méthode de Paiement
            </label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value as typeof prev.method }))}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cash">💵 Espèces</option>
              <option value="card">💳 Carte Bancaire</option>
              <option value="check">📝 Chèque</option>
              <option value="transfer">🏦 Virement Bancaire</option>
              <option value="mobile">📱 Paiement Mobile</option>
            </select>
          </div>

          <Input
            label="📅 Date du Paiement"
            type="date"
            icon={Calendar}
            value={paymentForm.date}
            onChange={(value) => setPaymentForm(prev => ({ ...prev, date: value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              📝 Notes (Optionnel)
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ajouter des notes sur ce paiement..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-6 border-t-2 border-slate-600">
          <Button onClick={handleAddPayment} icon={CreditCard} className="flex-1 py-3 text-base">
            ✓ Enregistrer le Paiement
          </Button>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)} className="px-6">
            Annuler
          </Button>
        </div>
      </Modal>
    </div>
  );
};

