/**
 * Order Service - Database operations for orders
 */

import { supabase } from '../lib/supabase';
import { Order, OrderItem } from '../types';

export interface CreateOrderInput {
  userId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    size: string;
    price: number;
  }[];
  notes?: string;
}

/**
 * Fetch all orders (admin only)
 */
export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          size,
          price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (orders || []).map(order => ({
      id: order.id,
      userId: order.user_id,
      products: (order.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        size: item.size,
        price: Number(item.price),
      })),
      status: order.status.toLowerCase().replace('_', '-') as 'pending' | 'in-progress' | 'delivered',
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
}

/**
 * Fetch orders for a specific user
 */
export async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          size,
          price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (orders || []).map(order => ({
      id: order.id,
      userId: order.user_id,
      products: (order.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        size: item.size,
        price: Number(item.price),
      })),
      status: order.status.toLowerCase().replace('_', '-') as 'pending' | 'in-progress' | 'delivered',
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

/**
 * Create a new order with items
 */
export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  try {
    // Calculate total
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId,
        total_amount: totalAmount,
        status: 'PENDING',
        notes: orderData.notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      size: item.size,
      price: item.price,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    return {
      id: order.id,
      userId: order.user_id,
      products: orderData.items,
      status: order.status.toLowerCase().replace('_', '-') as 'pending' | 'in-progress' | 'delivered',
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'in-progress' | 'delivered' | 'cancelled'
): Promise<void> {
  try {
    const dbStatus = status.toUpperCase().replace('-', '_');
    
    const { error } = await supabase
      .from('orders')
      .update({ status: dbStatus })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Delete an order and its items (admin only)
 */
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    // Delete order (CASCADE will automatically delete order_items)
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function fetchOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          size,
          price
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    if (!order) return null;

    return {
      id: order.id,
      userId: order.user_id,
      products: (order.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        size: item.size,
        price: Number(item.price),
      })),
      status: order.status.toLowerCase().replace('_', '-') as 'pending' | 'in-progress' | 'delivered',
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Search orders
 */
export async function searchOrders(searchTerm: string): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .rpc('search_orders', { search_term: searchTerm });

    if (error) throw error;

    // Fetch full order details with items
    const orderIds = orders.map((o: any) => o.id);
    const { data: fullOrders, error: fullError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          size,
          price
        )
      `)
      .in('id', orderIds);

    if (fullError) throw fullError;

    return (fullOrders || []).map(order => ({
      id: order.id,
      userId: order.user_id,
      products: (order.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        size: item.size,
        price: Number(item.price),
      })),
      status: order.status.toLowerCase().replace('_', '-') as 'pending' | 'in-progress' | 'delivered',
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  } catch (error) {
    console.error('Error searching orders:', error);
    // Fallback to fetching all if RPC not available
    return fetchAllOrders();
  }
}

/**
 * Get sales statistics
 */
export async function getSalesStats(startDate?: string, endDate?: string): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_sales_stats', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (error) throw error;

    const stats = data[0];
    return {
      totalOrders: Number(stats.total_orders),
      totalRevenue: Number(stats.total_revenue),
      averageOrderValue: Number(stats.average_order_value),
      pendingOrders: Number(stats.pending_orders),
      completedOrders: Number(stats.completed_orders),
    };
  } catch (error) {
    console.error('Error getting sales stats:', error);
    // Return zeros if function not available
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };
  }
}

