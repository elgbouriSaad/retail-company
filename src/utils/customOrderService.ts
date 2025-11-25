import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database, Json } from '../lib/database.types';
import {
  Order,
  OrderForm,
  PaymentInstallment,
  PongeItem,
  ReferenceMaterial,
} from '../types';
import {
  uploadCustomOrderImages,
  validateImageFiles,
} from './uploadService';

type OrderStatus = Order['status'];

type DbCustomOrderRow = Database['public']['Tables']['custom_orders']['Row'];
type DbCustomOrderInsert = Database['public']['Tables']['custom_orders']['Insert'];
type DbCustomOrderUpdate = Database['public']['Tables']['custom_orders']['Update'];

export interface CreateCustomOrderInput extends OrderForm {
  status: OrderStatus;
  paymentSchedule: PaymentInstallment[];
  totalAmount: number;
}

const client: SupabaseClient<Database, 'public', 'public'> = supabase;
const customOrders = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.from('custom_orders') as any;

const toJson = (value: unknown): Json => value as Json;

const parseJsonArray = <T>(value: Json | null): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }
  return [];
};

const mapRowToOrder = (row: DbCustomOrderRow): Order => {
  const pongeItems = parseJsonArray<PongeItem>(row.ponge_items);
  const referenceMaterials = parseJsonArray<ReferenceMaterial>(row.reference_materials);
  const images = parseJsonArray<string>(row.images);
  const schedule = parseJsonArray<PaymentInstallment>(row.payment_schedule);

  const products = pongeItems.map((item, index) => ({
    productId: item.id || `ponge-${index + 1}`,
    productName: item.description || `Article ${index + 1}`,
    quantity: 1,
    size: 'custom',
    price: 0,
  }));

  return {
    id: row.id,
    userId: 'custom-order',
    products,
    status: row.status.toLowerCase().replace('_', '-') as OrderStatus,
    totalAmount: Number(row.total_amount) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client_name,
    phoneNumber: row.phone_number,
    pongeItems,
    referenceMaterials,
    startDate: row.start_date || undefined,
    finishDate: row.finish_date || undefined,
    downPayment: Number(row.down_payment) || 0,
    advanceMoney: Number(row.advance_money) || 0,
    paymentMonths: row.payment_months,
    images,
    paymentSchedule: schedule,
  };
};

const toDbStatus = (status: OrderStatus): DbCustomOrderUpdate['status'] =>
  status.toUpperCase().replace('-', '_') as DbCustomOrderUpdate['status'];

export const fetchCustomOrders = async (): Promise<Order[]> => {
  const { data, error } = await customOrders()
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom orders', error);
    throw error;
  }

  return (data as DbCustomOrderRow[]).map(mapRowToOrder);
};

export const createCustomOrder = async (
  input: CreateCustomOrderInput
): Promise<Order> => {
  const { paymentSchedule, status, totalAmount, images, ...rest } = input;
  const files = images || [];

  if (files.length) {
    const validation = validateImageFiles(files);
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }
  }

  const insertPayload: DbCustomOrderInsert = {
    client_name: rest.clientName,
    phone_number: rest.phoneNumber,
    ponge_items: toJson(rest.pongeItems),
    reference_materials: toJson(rest.referenceMaterials),
    images: toJson([]),
    start_date: rest.startDate || null,
    finish_date: rest.finishDate || new Date().toISOString(),
    down_payment: rest.downPayment,
    advance_money: rest.advanceMoney,
    payment_months: rest.paymentMonths,
    total_amount: totalAmount,
    status: toDbStatus(status) as DbCustomOrderInsert['status'],
    payment_schedule: toJson(paymentSchedule),
  };

  const { data, error } = await customOrders()
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom order', error);
    throw error;
  }

  let createdRow = data as DbCustomOrderRow;

  if (files.length) {
    try {
      const imageUrls = await uploadCustomOrderImages(files, createdRow.id);
      const { data: updatedRow, error: updateError } = await customOrders()
        .update({ images: toJson(imageUrls) as DbCustomOrderUpdate['images'] })
        .eq('id', createdRow.id)
        .select('*')
        .single();

      if (updateError) {
        throw updateError;
      }

      createdRow = updatedRow as DbCustomOrderRow;
    } catch (uploadError) {
      console.error('Error uploading custom order images', uploadError);
      throw uploadError;
    }
  }

  return mapRowToOrder(createdRow);
};

export const updateCustomOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<Order> => {
  const payload: DbCustomOrderUpdate = {
    status: toDbStatus(status),
  };

  const { data, error } = await customOrders()
    .update(payload)
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom order status', error);
    throw error;
  }

  return mapRowToOrder(data as DbCustomOrderRow);
};

export const updateCustomOrderSchedule = async (
  orderId: string,
  schedule: PaymentInstallment[],
  status?: OrderStatus
): Promise<Order> => {
  const payload: DbCustomOrderUpdate = {
    payment_schedule: toJson(schedule),
  };

  if (status) {
    payload.status = toDbStatus(status);
  }

  const { data, error } = await customOrders()
    .update(payload)
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating payment schedule', error);
    throw error;
  }

  return mapRowToOrder(data as DbCustomOrderRow);
};

export const deleteCustomOrder = async (orderId: string): Promise<void> => {
  const { error } = await customOrders()
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting custom order', error);
    throw error;
  }
};

