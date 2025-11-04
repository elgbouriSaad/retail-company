import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { mockOrders } from '../../data/mockData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const OrdersPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const userOrders = mockOrders.filter(order => order.userId === user?.id);

  const handleSubmitOrder = () => {
    // In a real app, this would submit to an API
    const orderTotal = getTotalAmount();
    if (orderTotal === 0) {
      alert('Your cart is empty. Please add some items before submitting an order.');
      return;
    }
    
    setOrderSubmitted(true);
    clearCart();
    
    // Show success message
    setTimeout(() => {
      alert(`Order submitted successfully! Total: $${orderTotal.toFixed(2)}. You will receive a confirmation email shortly.`);
    }, 1000);
    
    setTimeout(() => {
      setShowOrderModal(false);
      setOrderSubmitted(false);
    }, 2000);
  };

  const handleViewOrderDetails = (orderId: string) => {
    const order = userOrders.find(o => o.id === orderId);
    if (order) {
      alert(`Order #${orderId} Details:\nStatus: ${order.status}\nTotal: $${order.totalAmount.toFixed(2)}\nDate: ${new Date(order.createdAt).toLocaleDateString()}`);
    }
  };

  const handleDownloadReceipt = (orderId: string) => {
    alert(`Receipt for Order #${orderId} is being downloaded...`);
  };

  const handleReorderItems = (orderId: string) => {
    const order = userOrders.find(o => o.id === orderId);
    if (order) {
      // Add all items from the order back to cart
      order.products.forEach(product => {
        // Find the actual product to add to cart
        const actualProduct = mockProducts.find(p => p.id === product.productId);
        if (actualProduct) {
          addToCart(actualProduct, product.quantity, product.size);
        }
      });
      alert(`All items from Order #${orderId} have been added to your cart!`);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Orders & Cart</h1>
        <p className="text-slate-400">Manage your current cart and view order history</p>
      </div>

      {/* Current Cart */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Current Cart ({cartItems.length} items)
          </h2>
          {cartItems.length > 0 && (
            <Button onClick={() => setShowOrderModal(true)}>
              Review Order
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Your cart is empty</p>
            <p className="text-slate-500 text-sm">Add some products to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{item.product.name}</h3>
                  <p className="text-slate-400 text-sm">Size: {item.size}</p>
                  <p className="text-blue-400 font-semibold">${item.product.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-white font-semibold px-3">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-right">
                  <p className="text-white font-semibold">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeFromCart(item.product.id, item.size)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t border-slate-600 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-white">Total:</span>
                <span className="text-2xl font-bold text-blue-400">
                  ${getTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Order History */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-6">Order History</h2>

        {userOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => (
              <div key={order.id} className="p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">Order #{order.id}</h3>
                    <p className="text-slate-400 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <p className="text-white font-semibold mt-1">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.products.map((product, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        {product.productName} (x{product.quantity}) - {product.size}
                      </span>
                      <span className="text-slate-300">
                        ${(product.price * product.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex space-x-2">
                  <Button size="sm" variant="ghost">
                    <Button size="sm" variant="ghost" onClick={() => handleViewOrderDetails(order.id)}>
                      View Details
                    </Button>
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadReceipt(order.id)}>
                      Download Receipt
                    </Button>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleReorderItems(order.id)}>
                    Reorder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Order Review Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Review Your Order"
        size="lg"
      >
        {orderSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Order Submitted!</h3>
            <p className="text-slate-400">Thank you for your order. We'll process it shortly.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-white">{item.product.name}</h4>
                    <p className="text-slate-400 text-sm">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <span className="text-white font-semibold">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-600 pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-white">Total:</span>
                <span className="font-bold text-blue-400">
                  ${getTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowOrderModal(false)}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={handleSubmitOrder}
                className="flex-1"
              >
                Submit Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};