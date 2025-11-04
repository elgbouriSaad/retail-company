import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Eye, Download, DollarSign, CreditCard, Calendar, Trash2, CreditCard as Edit } from 'lucide-react';
import { Invoice, InvoiceItem, Payment } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';

export const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      reference: 'INV-2411-0001-342',
      clientId: '1',
      clientName: 'John Doe',
      date: '2024-11-04',
      items: [
        {
          id: '1',
          description: 'Custom Dress Design',
          quantity: 1,
          unitPrice: 500,
          total: 500,
          category: 'labor'
        },
        {
          id: '2',
          description: 'Premium Silk Fabric',
          quantity: 3,
          unitPrice: 50,
          total: 150,
          category: 'fabric'
        }
      ],
      subtotal: 650,
      total: 650,
      amountPaid: 200,
      amountDue: 450,
      status: 'partial',
      createdAt: '2024-11-04T10:00:00Z',
      updatedAt: '2024-11-04T10:00:00Z'
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      invoiceId: '1',
      method: 'cash',
      amount: 200,
      date: '2024-11-04',
      createdAt: '2024-11-04T10:00:00Z'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0, category: 'labor' as const }],
    discountType: '' as 'percentage' | 'amount' | '',
    discountValue: 0,
    amountPaid: 0,
    paymentMethod: 'cash' as const,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    method: 'cash' as const,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const generateReference = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const nextNumber = (invoices.length + 1).toString().padStart(4, '0');
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${nextNumber}-${randomSuffix}`;
  };

  const calculateInvoiceTotals = (items: InvoiceItem[], discountType: string, discountValue: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    let total = subtotal;
    
    if (discountType === 'percentage') {
      total = subtotal * (1 - discountValue / 100);
    } else if (discountType === 'amount') {
      total = subtotal - discountValue;
    }
    
    return { subtotal, total };
  };

  const updateInvoiceStatus = (invoice: Invoice) => {
    if (invoice.amountDue <= 0) {
      return 'paid';
    } else if (invoice.amountPaid > 0) {
      return 'partial';
    } else {
      return 'unpaid';
    }
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: 'labor'
    };
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeInvoiceItem = (id: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateInvoiceItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleCreateInvoice = () => {
    if (!invoiceForm.clientName || invoiceForm.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Please fill in all required fields and ensure all items have valid quantities and prices.');
      return;
    }

    const { subtotal, total } = calculateInvoiceTotals(
      invoiceForm.items,
      invoiceForm.discountType,
      invoiceForm.discountValue
    );

    const amountDue = total - invoiceForm.amountPaid;
    const status = updateInvoiceStatus({ amountPaid: invoiceForm.amountPaid, amountDue } as Invoice);

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      reference: generateReference(),
      clientId: Date.now().toString(),
      clientName: invoiceForm.clientName,
      date: invoiceForm.date,
      items: invoiceForm.items,
      subtotal,
      discountType: invoiceForm.discountType || undefined,
      discountValue: invoiceForm.discountValue || undefined,
      total,
      amountPaid: invoiceForm.amountPaid,
      amountDue,
      status: status as 'paid' | 'partial' | 'unpaid',
      notes: invoiceForm.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, newInvoice]);

    // Create initial payment if amount paid > 0
    if (invoiceForm.amountPaid > 0) {
      const newPayment: Payment = {
        id: Date.now().toString(),
        invoiceId: newInvoice.id,
        method: invoiceForm.paymentMethod,
        amount: invoiceForm.amountPaid,
        date: invoiceForm.date,
        createdAt: new Date().toISOString()
      };
      setPayments(prev => [...prev, newPayment]);
    }

    alert(`Invoice ${newInvoice.reference} created successfully!`);
    setShowCreateInvoiceModal(false);
    resetInvoiceForm();
  };

  const handleAddPayment = () => {
    if (!selectedInvoice) return;

    const newPayment: Payment = {
      id: Date.now().toString(),
      invoiceId: selectedInvoice.id,
      method: paymentForm.method,
      amount: paymentForm.amount,
      date: paymentForm.date,
      reference: paymentForm.reference,
      notes: paymentForm.notes,
      createdAt: new Date().toISOString()
    };

    setPayments(prev => [...prev, newPayment]);

    // Update invoice
    const newAmountPaid = selectedInvoice.amountPaid + paymentForm.amount;
    const newAmountDue = selectedInvoice.total - newAmountPaid;
    const newStatus = updateInvoiceStatus({ amountPaid: newAmountPaid, amountDue: newAmountDue } as Invoice);

    setInvoices(prev => prev.map(invoice =>
      invoice.id === selectedInvoice.id
        ? {
            ...invoice,
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus as 'paid' | 'partial' | 'unpaid',
            updatedAt: new Date().toISOString()
          }
        : invoice
    ));

    setShowPaymentModal(false);
    setPaymentForm({
      method: 'cash',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    if (confirm('Are you sure you want to delete this payment?')) {
      setPayments(prev => prev.filter(p => p.id !== paymentId));

      // Update invoice
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice) {
        const newAmountPaid = invoice.amountPaid - payment.amount;
        const newAmountDue = invoice.total - newAmountPaid;
        const newStatus = updateInvoiceStatus({ amountPaid: newAmountPaid, amountDue: newAmountDue } as Invoice);

        setInvoices(prev => prev.map(inv =>
          inv.id === payment.invoiceId
            ? {
                ...inv,
                amountPaid: newAmountPaid,
                amountDue: newAmountDue,
                status: newStatus as 'paid' | 'partial' | 'unpaid',
                updatedAt: new Date().toISOString()
              }
            : inv
        ));
      }
      alert('Payment deleted successfully!');
    alert(`Payment of $${paymentForm.amount} added successfully!`);
    }
  };

  const handleDuplicateInvoice = (invoice: any) => {
    const duplicatedInvoice = {
      ...invoice,
      id: Date.now().toString(),
      reference: generateReference(),
      date: new Date().toISOString().split('T')[0],
      amountPaid: 0,
      amountDue: invoice.total,
      status: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setInvoices(prev => [...prev, duplicatedInvoice]);
    alert(`Invoice duplicated as ${duplicatedInvoice.reference}!`);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice? This will also delete all associated payments.')) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setPayments(prev => prev.filter(payment => payment.invoiceId !== invoiceId));
      alert('Invoice deleted successfully!');
    }
  };

  const handleSendInvoice = (invoice: any) => {
    // In a real app, this would send the invoice via email
    alert(`Invoice ${invoice.reference} sent to ${invoice.clientName} successfully!`);
  };

  const handleDownloadPDF = (invoice: any) => {
    // In a real app, this would generate and download a PDF
    alert(`PDF for invoice ${invoice.reference} is being generated...`);
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      clientName: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0, category: 'labor' }],
      discountType: '',
      discountValue: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-400/10';
      case 'partial':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'unpaid':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getInvoicePayments = (invoiceId: string) => {
    return payments.filter(payment => payment.invoiceId === invoiceId);
  };

  const { subtotal: formSubtotal, total: formTotal } = calculateInvoiceTotals(
    invoiceForm.items,
    invoiceForm.discountType,
    invoiceForm.discountValue
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Management</h1>
          <p className="text-slate-400">Create and manage invoices with payment tracking</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateInvoiceModal(true)}>
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{invoices.length}</p>
          <p className="text-slate-400">Total Invoices</p>
        </Card>

        <Card className="text-center">
          <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            ${invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
          </p>
          <p className="text-slate-400">Total Amount</p>
        </Card>

        <Card className="text-center">
          <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            ${invoices.reduce((sum, inv) => sum + inv.amountPaid, 0).toFixed(2)}
          </p>
          <p className="text-slate-400">Amount Paid</p>
        </Card>

        <Card className="text-center">
          <Calendar className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            ${invoices.reduce((sum, inv) => sum + inv.amountDue, 0).toFixed(2)}
          </p>
          <p className="text-slate-400">Amount Due</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search invoices..."
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
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <div className="text-slate-300 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            {filteredInvoices.length} invoices
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-300 font-medium">Reference</th>
                <th className="text-left py-3 text-slate-300 font-medium">Client</th>
                <th className="text-left py-3 text-slate-300 font-medium">Date</th>
                <th className="text-left py-3 text-slate-300 font-medium">Total</th>
                <th className="text-left py-3 text-slate-300 font-medium">Paid</th>
                <th className="text-left py-3 text-slate-300 font-medium">Due</th>
                <th className="text-left py-3 text-slate-300 font-medium">Status</th>
                <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-700/50">
                  <td className="py-4 text-white font-mono">{invoice.reference}</td>
                  <td className="py-4 text-white">{invoice.clientName}</td>
                  <td className="py-4 text-slate-300">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-white font-semibold">${invoice.total.toFixed(2)}</td>
                  <td className="py-4 text-green-400">${invoice.amountPaid.toFixed(2)}</td>
                  <td className="py-4 text-red-400">${invoice.amountDue.toFixed(2)}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowInvoiceModal(true);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Download}
                        onClick={() => handleDownloadPDF(invoice)}
                      >
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendInvoice(invoice)}
                      >
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDuplicateInvoice(invoice)}
                      >
                        Duplicate
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={DollarSign}
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentForm(prev => ({
                              ...prev,
                              amount: invoice.amountDue
                            }));
                            setShowPaymentModal(true);
                          }}
                        >
                          Pay
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateInvoiceModal}
        onClose={() => setShowCreateInvoiceModal(false)}
        title="Create New Invoice"
        size="xl"
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              value={invoiceForm.clientName}
              onChange={(value) => setInvoiceForm(prev => ({ ...prev, clientName: value }))}
              placeholder="Enter client name"
              required
            />
            <Input
              label="Date"
              type="date"
              value={invoiceForm.date}
              onChange={(value) => setInvoiceForm(prev => ({ ...prev, date: value }))}
              required
            />
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Invoice Items</h4>
              <Button size="sm" onClick={addInvoiceItem} icon={Plus}>
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {invoiceForm.items.map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Input
                      label="Description"
                      value={item.description}
                      onChange={(value) => updateInvoiceItem(item.id!, 'description', value)}
                      placeholder="Item description"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateInvoiceItem(item.id!, 'category', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="fabric">Fabric</option>
                        <option value="labor">Labor</option>
                        <option value="accessories">Accessories</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <Input
                      label="Quantity"
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(value) => updateInvoiceItem(item.id!, 'quantity', parseInt(value) || 0)}
                      min="1"
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      value={item.unitPrice.toString()}
                      onChange={(value) => updateInvoiceItem(item.id!, 'unitPrice', parseFloat(value) || 0)}
                      min="0"
                    />
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Total</label>
                        <div className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white">
                          ${item.total.toFixed(2)}
                        </div>
                      </div>
                      {invoiceForm.items.length > 1 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeInvoiceItem(item.id!)}
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

          {/* Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type</label>
              <select
                value={invoiceForm.discountType}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, discountType: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Discount</option>
                <option value="percentage">Percentage</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              type="number"
              step="0.01"
              value={invoiceForm.discountValue.toString()}
              onChange={(value) => setInvoiceForm(prev => ({ ...prev, discountValue: parseFloat(value) || 0 }))}
              placeholder="0"
              disabled={!invoiceForm.discountType}
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Subtotal</label>
              <div className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white">
                ${formSubtotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Initial Payment"
              type="number"
              step="0.01"
              value={invoiceForm.amountPaid.toString()}
              onChange={(value) => setInvoiceForm(prev => ({ ...prev, amountPaid: parseFloat(value) || 0 }))}
              placeholder="0.00"
              min="0"
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
              <select
                value={invoiceForm.paymentMethod}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={invoiceForm.amountPaid === 0}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="check">Check</option>
                <option value="transfer">Transfer</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Total</label>
              <div className="px-3 py-2 bg-blue-600 border border-blue-500 rounded-lg text-white font-semibold">
                ${formTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-6 border-t border-slate-700">
          <Button onClick={handleCreateInvoice}>
            Create Invoice
          </Button>
          <Button variant="secondary" onClick={() => setShowCreateInvoiceModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title={`Invoice ${selectedInvoice?.reference}`}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3">Invoice Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Reference:</span>
                    <span className="text-white ml-2 font-mono">{selectedInvoice.reference}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Client:</span>
                    <span className="text-white ml-2">{selectedInvoice.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Date:</span>
                    <span className="text-white ml-2">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white">${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountValue && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Discount:</span>
                      <span className="text-red-400">
                        -{selectedInvoice.discountType === 'percentage' 
                          ? `${selectedInvoice.discountValue}%` 
                          : `$${selectedInvoice.discountValue.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-white">${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="text-green-400">${selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Amount Due:</span>
                    <span className="text-red-400">${selectedInvoice.amountDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Invoice Items</h4>
              <div className="space-y-2">
                {selectedInvoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">{item.description}</p>
                      <p className="text-slate-400 text-sm capitalize">
                        {item.category} | Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-white font-semibold">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Payment History</h4>
                {selectedInvoice.status !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setPaymentForm(prev => ({
                        ...prev,
                        amount: selectedInvoice.amountDue
                      }));
                      setShowPaymentModal(true);
                    }}
                    icon={Plus}
                  >
                    Add Payment
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getInvoicePayments(selectedInvoice.id).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">${payment.amount.toFixed(2)}</p>
                      <p className="text-slate-400 text-sm capitalize">
                        {payment.method} | {new Date(payment.date).toLocaleDateString()}
                      </p>
                      {payment.reference && (
                        <p className="text-slate-500 text-xs">Ref: {payment.reference}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeletePayment(payment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {getInvoicePayments(selectedInvoice.id).length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No payments recorded</p>
                )}
              </div>
            </div>

            {selectedInvoice.notes && (
              <div>
                <h4 className="text-white font-semibold mb-2">Notes</h4>
                <p className="text-slate-300 text-sm p-3 bg-slate-700 rounded-lg">
                  {selectedInvoice.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Add Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={paymentForm.amount.toString()}
              onChange={(value) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(value) || 0 }))}
              placeholder="0.00"
              min="0"
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="check">Check</option>
                <option value="transfer">Transfer</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={paymentForm.date}
              onChange={(value) => setPaymentForm(prev => ({ ...prev, date: value }))}
              required
            />
            <Input
              label="Reference"
              value={paymentForm.reference}
              onChange={(value) => setPaymentForm(prev => ({ ...prev, reference: value }))}
              placeholder="Payment reference (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Payment notes (optional)"
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>

          {selectedInvoice && (
            <div className="p-4 bg-slate-700 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Total:</span>
                  <span className="text-white">${selectedInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Already Paid:</span>
                  <span className="text-green-400">${selectedInvoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">This Payment:</span>
                  <span className="text-blue-400">${paymentForm.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-600 pt-1">
                  <span className="text-white">Remaining:</span>
                  <span className="text-white">
                    ${Math.max(0, selectedInvoice.amountDue - paymentForm.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleAddPayment}>
              Add Payment
            </Button>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};