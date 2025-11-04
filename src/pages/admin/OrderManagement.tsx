import React, { useState } from 'react';
import { Package, Search, Filter, Eye, Truck, CheckCircle, Clock, X, Plus, Upload, Trash2, Calendar } from 'lucide-react';
import { mockOrders, mockUsers } from '../../data/mockData';
import { OrderForm, PongeItem, ReferenceMaterial } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    clientName: '',
    phoneNumber: '',
    pongeItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
    referenceMaterials: [{ id: '1', name: '', description: '', quantity: 1 }],
    images: [],
    startDate: '',
    finishDate: '',
    downPayment: 0,
    paymentMonths: 1,
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const filteredOrders = orders.filter(order => {
    const user = mockUsers.find(u => u.id === order.userId);
    const matchesSearch = order.id.includes(searchTerm) ||
                         user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products.some(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'in-progress';
      case 'in-progress':
        return 'delivered';
      default:
        return currentStatus;
    }
  };

  const canAdvanceStatus = (status: string) => {
    return status === 'pending' || status === 'in-progress';
  };

  const addPongeItem = () => {
    const newItem: PongeItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
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

  const updatePongeItem = (id: string, field: keyof PongeItem, value: any) => {
    setOrderForm(prev => ({
      ...prev,
      pongeItems: prev.pongeItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

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

  const updateReferenceMaterial = (id: string, field: keyof ReferenceMaterial, value: any) => {
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

      // Create preview URLs
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

  const generateInvoiceReference = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const nextNumber = (invoices.length + 1).toString().padStart(4, '0');
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${nextNumber}-${randomSuffix}`;
  };

  const createInvoiceForOrder = (order: any) => {
    const invoiceItems = order.pongeItems?.map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      category: 'labor' as const
    })) || order.products.map((product: any) => ({
      id: product.productId,
      description: product.productName,
      quantity: product.quantity,
      unitPrice: product.price,
      total: product.price * product.quantity,
      category: 'fabric' as const
    }));

    const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const downPayment = order.downPayment || 0;
    const amountDue = subtotal - downPayment;
    
    const newInvoice = {
      id: Date.now().toString() + '-inv',
      reference: generateInvoiceReference(),
      clientId: order.userId || 'custom-client',
      clientName: order.clientName || 'Unknown Client',
      date: order.createdAt.split('T')[0],
      items: invoiceItems,
      subtotal,
      total: subtotal,
      amountPaid: downPayment,
      amountDue,
      status: downPayment >= subtotal ? 'paid' : downPayment > 0 ? 'partial' : 'unpaid',
      notes: `Auto-generated from Order #${order.id}. Payment terms: ${order.paymentMonths || 1} months.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, newInvoice]);
    
    // Create initial payment record if down payment was made
    if (downPayment > 0) {
      // This would typically be handled by the payment system
      console.log('Payment record created for invoice:', newInvoice.reference, 'Amount:', downPayment);
    }

    return newInvoice;
  };

  const handleCreateOrder = () => {
    // Calculate total from ponge items
    const total = orderForm.pongeItems.reduce((sum, item) => sum + item.total, 0);
    
    const newOrder = {
      id: Date.now().toString(),
      userId: 'admin-created',
      products: orderForm.pongeItems.map(item => ({
        productId: item.id,
        productName: item.description,
        quantity: item.quantity,
        size: 'Custom',
        price: item.unitPrice,
      })),
      status: 'pending' as const,
      totalAmount: total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientName: orderForm.clientName,
      phoneNumber: orderForm.phoneNumber,
      referenceMaterials: orderForm.referenceMaterials,
      startDate: orderForm.startDate,
      finishDate: orderForm.finishDate,
      downPayment: orderForm.downPayment,
      paymentMonths: orderForm.paymentMonths,
      images: uploadedImages,
    };

    setOrders(prev => [...prev, newOrder]);
    
    // Automatically create invoice for the new order
    const invoice = createInvoiceForOrder(newOrder);
    
    // Show success message with invoice reference
    alert(`Order created successfully! Invoice ${invoice.reference} has been generated automatically.`);
    
    setShowCreateOrderModal(false);
    
    // Reset form
    setOrderForm({
      clientName: '',
      phoneNumber: '',
      pongeItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
      referenceMaterials: [{ id: '1', name: '', description: '', quantity: 1 }],
      images: [],
      startDate: '',
      finishDate: '',
      downPayment: 0,
      paymentMonths: 1,
    });
    setUploadedImages([]);
  };

  const handleStartProcessing = (orderId: string) => {
    handleStatusUpdate(orderId, 'in-progress');
  };

  const handleMarkDelivered = (orderId: string) => {
    handleStatusUpdate(orderId, 'delivered');
  };

  const handleViewOrderDetails = (order: any) => {
    handleViewOrder(order);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
          <p className="text-slate-400">Track and manage all customer orders</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateOrderModal(true)}>
          Create Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{orders.length}</p>
          <p className="text-slate-400">Total Orders</p>
        </Card>

        <Card className="text-center">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {orders.filter(o => o.status === 'pending').length}
          </p>
          <p className="text-slate-400">Pending</p>
        </Card>

        <Card className="text-center">
          <Truck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {orders.filter(o => o.status === 'in-progress').length}
          </p>
          <p className="text-slate-400">In Progress</p>
        </Card>

        <Card className="text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
          <p className="text-slate-400">Delivered</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={Search}
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="delivered">Delivered</option>
          </select>

          <div className="text-slate-300 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            {filteredOrders.length} orders
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-300 font-medium">Order ID</th>
                <th className="text-left py-3 text-slate-300 font-medium">Customer</th>
                <th className="text-left py-3 text-slate-300 font-medium">Products</th>
                <th className="text-left py-3 text-slate-300 font-medium">Status</th>
                <th className="text-left py-3 text-slate-300 font-medium">Date</th>
                <th className="text-left py-3 text-slate-300 font-medium">Total</th>
                <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const user = mockUsers.find(u => u.id === order.userId);
                
                return (
                  <tr key={order.id} className="border-b border-slate-700/50">
                    <td className="py-4 text-white font-mono">#{order.id}</td>
                    <td className="py-4">
                      <div>
                        <p className="text-white font-semibold">{user?.name || 'Unknown User'}</p>
                        <p className="text-slate-400 text-sm">{user?.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        {order.products.slice(0, 2).map((product, idx) => (
                          <div key={idx} className="text-slate-300 text-sm">
                            {product.productName} (x{product.quantity})
                          </div>
                        ))}
                        {order.products.length > 2 && (
                          <div className="text-slate-400 text-xs">
                            +{order.products.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status.replace('-', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      <div>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400">
                          Updated: {new Date(order.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 text-white font-semibold">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => handleViewOrder(order)}
                        >
                          View
                        </Button>
                        {canAdvanceStatus(order.status) && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => order.status === 'pending' 
                              ? handleStartProcessing(order.id) 
                              : handleMarkDelivered(order.id)
                            }
                          >
                            {order.status === 'pending' ? 'Start Processing' : 'Mark Delivered'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteOrder(order.id)}
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

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title={`Order #${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3">Customer Information</h4>
                {(() => {
                  const user = mockUsers.find(u => u.id === selectedOrder.userId);
                  return (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-400">Name:</span>
                        <span className="text-white ml-2">{user?.name || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <span className="text-white ml-2">{user?.email || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-white ml-2">{user?.phone || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Address:</span>
                        <span className="text-white ml-2">{user?.address || 'Not provided'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Order Date:</span>
                    <span className="text-white ml-2">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Updated:</span>
                    <span className="text-white ml-2">{new Date(selectedOrder.updatedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1 capitalize">{selectedOrder.status.replace('-', ' ')}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="text-white ml-2 font-semibold">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.products.map((product: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">{product.productName}</p>
                      <p className="text-slate-400 text-sm">Size: {product.size} | Quantity: {product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">${(product.price * product.quantity).toFixed(2)}</p>
                      <p className="text-slate-400 text-sm">${product.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-700">
              {canAdvanceStatus(selectedOrder.status) && (
                <Button
                  onClick={() => {
                    if (selectedOrder.status === 'pending') {
                      handleStartProcessing(selectedOrder.id);
                    } else {
                      handleMarkDelivered(selectedOrder.id);
                    }
                    setShowOrderModal(false);
                  }}
                >
                  {order.status === 'pending' ? 'Start Processing' : 'View Details'}
                </Button>
              )}
              <Button 
                variant="secondary"
                onClick={() => {
                  const invoice = createInvoiceForOrder(selectedOrder);
                  alert(`New invoice ${invoice.reference} created for this order!`);
                }}
              >
                Create Invoice
              </Button>
              <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        title="Create New Order"
        size="xl"
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              value={orderForm.clientName}
              onChange={(value) => setOrderForm(prev => ({ ...prev, clientName: value }))}
              placeholder="Enter client name"
              required
            />
            <Input
              label="Phone Number"
              value={orderForm.phoneNumber}
              onChange={(value) => setOrderForm(prev => ({ ...prev, phoneNumber: value }))}
              placeholder="Enter phone number"
              required
            />
          </div>

          {/* Ponge Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Ponge Items</h4>
              <Button size="sm" onClick={addPongeItem} icon={Plus}>
                Add Ponge
              </Button>
            </div>
            <div className="space-y-3">
              {orderForm.pongeItems.map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      label="Description"
                      value={item.description}
                      onChange={(value) => updatePongeItem(item.id, 'description', value)}
                      placeholder="Ponge description"
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(value) => updatePongeItem(item.id, 'quantity', parseInt(value) || 0)}
                      min="1"
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      value={item.unitPrice.toString()}
                      onChange={(value) => updatePongeItem(item.id, 'unitPrice', parseFloat(value) || 0)}
                      min="0"
                    />
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Total</label>
                        <div className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white">
                          ${item.total.toFixed(2)}
                        </div>
                      </div>
                      {orderForm.pongeItems.length > 1 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removePongeItem(item.id)}
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

          {/* Reference Materials */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Reference Materials</h4>
              <Button size="sm" onClick={addReferenceMaterial} icon={Plus}>
                Add Material
              </Button>
            </div>
            <div className="space-y-3">
              {orderForm.referenceMaterials.map((material, index) => (
                <div key={material.id} className="p-4 bg-slate-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Material Name"
                      value={material.name}
                      onChange={(value) => updateReferenceMaterial(material.id, 'name', value)}
                      placeholder="Material name"
                    />
                    <Input
                      label="Description"
                      value={material.description}
                      onChange={(value) => updateReferenceMaterial(material.id, 'description', value)}
                      placeholder="Material description"
                    />
                    <div className="flex items-end space-x-2">
                      <Input
                        label="Quantity"
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
            <h4 className="text-white font-semibold mb-4">Upload Images</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
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
              label="Start Date"
              type="date"
              icon={Calendar}
              value={orderForm.startDate}
              onChange={(value) => setOrderForm(prev => ({ ...prev, startDate: value }))}
              required
            />
            <Input
              label="Finish Date"
              type="date"
              icon={Calendar}
              value={orderForm.finishDate}
              onChange={(value) => setOrderForm(prev => ({ ...prev, finishDate: value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Down Payment"
              type="number"
              step="0.01"
              value={orderForm.downPayment.toString()}
              onChange={(value) => setOrderForm(prev => ({ ...prev, downPayment: parseFloat(value) || 0 }))}
              placeholder="0.00"
              min="0"
            />
            <Input
              label="Payment Months"
              type="number"
              value={orderForm.paymentMonths.toString()}
              onChange={(value) => setOrderForm(prev => ({ ...prev, paymentMonths: parseInt(value) || 1 }))}
              min="1"
              max="24"
            />
          </div>

          {/* Order Summary */}
          <div className="p-4 bg-slate-700 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-white font-semibold">
                  ${orderForm.pongeItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Down Payment:</span>
                <span className="text-white">${orderForm.downPayment.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-white">
                  ${(orderForm.pongeItems.reduce((sum, item) => sum + item.total, 0) - orderForm.downPayment).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Payment:</span>
                <span className="text-white">
                  ${((orderForm.pongeItems.reduce((sum, item) => sum + item.total, 0) - orderForm.downPayment) / orderForm.paymentMonths).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-6 border-t border-slate-700">
          <Button onClick={handleCreateOrder}>
            Create Order
          </Button>
          <Button variant="secondary" onClick={() => setShowCreateOrderModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};