import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
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
type DbCustomOrderItemRow = Database['public']['Tables']['custom_order_items']['Row'];
type DbCustomOrderRefMaterialRow =
  Database['public']['Tables']['custom_order_reference_materials']['Row'];
type DbCustomOrderImageRow = Database['public']['Tables']['custom_order_images']['Row'];
type DbCustomOrderInstallmentRow =
  Database['public']['Tables']['custom_order_installments']['Row'];
type DbCustomOrderPaymentInsert =
  Database['public']['Tables']['custom_order_payments']['Insert'];

type DbCustomOrderWithRelations = DbCustomOrderRow & {
  custom_order_items: DbCustomOrderItemRow[];
  custom_order_reference_materials: DbCustomOrderRefMaterialRow[];
  custom_order_images: DbCustomOrderImageRow[];
  custom_order_installments: DbCustomOrderInstallmentRow[];
};

export interface CreateCustomOrderInput extends OrderForm {
  status: OrderStatus;
  paymentSchedule: PaymentInstallment[];
  totalAmount: number;
}

export interface RecordCustomOrderPaymentInput {
  orderId: string;
  installmentId: string;
  amount: number;
  method: PaymentInstallment['method'];
  date: string;
  notes?: string;
}

const client: SupabaseClient<Database, 'public', 'public'> = supabase;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customOrders = () => client.from('custom_orders') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customOrderItems = () => client.from('custom_order_items') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customOrderRefMaterials = () => client.from('custom_order_reference_materials') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customOrderImages = () => client.from('custom_order_images') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customOrderInstallments = () => client.from('custom_order_installments') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customOrderPayments = () => client.from('custom_order_payments') as any;
const CUSTOM_ORDER_SELECT = `
  *,
  custom_order_items(*),
  custom_order_reference_materials(*),
  custom_order_images(*),
  custom_order_installments(*)
`;

const sortByPosition = <T extends { position?: number }>(rows: T[] = []): T[] =>
  [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

const fromDbOrderStatus = (status: DbCustomOrderRow['status']): OrderStatus =>
  status.toLowerCase().replace('_', '-') as OrderStatus;

const toDbStatus = (status: OrderStatus): DbCustomOrderUpdate['status'] =>
  status.toUpperCase().replace('-', '_') as DbCustomOrderUpdate['status'];

const fromDbInstallmentStatus = (
  status: DbCustomOrderInstallmentRow['status']
): PaymentInstallment['status'] => status.toLowerCase() as PaymentInstallment['status'];

const toDbInstallmentStatus = (
  status: PaymentInstallment['status']
): DbCustomOrderInstallmentRow['status'] =>
  status.toUpperCase() as DbCustomOrderInstallmentRow['status'];

const fromDbPaymentMethod = (
  method: DbCustomOrderInstallmentRow['method'] | null
): PaymentInstallment['method'] | undefined =>
  method ? (method.toLowerCase() as PaymentInstallment['method']) : undefined;

const toDbPaymentMethod = (
  method?: PaymentInstallment['method'] | null
): DbCustomOrderInstallmentRow['method'] | null =>
  method ? (method.toUpperCase() as DbCustomOrderInstallmentRow['method']) : null;

const toUtcTimestamp = (date?: string): string => {
  if (!date) {
    return new Date().toISOString();
  }
  return `${date}T00:00:00Z`;
};

const mapInstallments = (
  rows: DbCustomOrderInstallmentRow[] = []
): PaymentInstallment[] =>
  sortByPosition(rows).map(row => ({
    id: row.id,
    dueDate: row.due_date,
    amount: Number(row.amount) || 0,
    status: fromDbInstallmentStatus(row.status),
    paidDate: row.paid_date || undefined,
    paidAmount: row.paid_amount !== null ? Number(row.paid_amount) : undefined,
    method: fromDbPaymentMethod(row.method),
    notes: row.notes || undefined,
  }));

const mapRowToOrder = (row: DbCustomOrderWithRelations): Order => {
  const pongeItems: PongeItem[] = sortByPosition(row.custom_order_items).map(item => ({
    id: item.id,
    description: item.description,
  }));

  const referenceMaterials: ReferenceMaterial[] = sortByPosition(
    row.custom_order_reference_materials
  ).map(material => ({
    id: material.id,
    name: material.name,
    description: material.description ?? '',
    quantity: material.quantity,
  }));

  const images = sortByPosition(row.custom_order_images).map(image => image.url);
  const paymentSchedule = mapInstallments(row.custom_order_installments);

  const products = pongeItems.map((item, index) => ({
    productId: item.id,
    productName: item.description || `Article ${index + 1}`,
    quantity: 1,
    size: 'custom',
    price: 0,
  }));

  return {
    id: row.id,
    userId: 'custom-order',
    products,
    status: fromDbOrderStatus(row.status),
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
    paymentSchedule,
  };
};

const fetchCustomOrderById = async (orderId: string): Promise<Order> => {
  const { data, error } = await customOrders()
    .select(CUSTOM_ORDER_SELECT)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching custom order', error);
    throw error;
  }

  return mapRowToOrder(data as DbCustomOrderWithRelations);
};

export const fetchCustomOrders = async (): Promise<Order[]> => {
  const { data, error } = await customOrders()
    .select(CUSTOM_ORDER_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom orders', error);
    throw error;
  }

  return (data as DbCustomOrderWithRelations[]).map(mapRowToOrder);
};

const insertPongeItems = async (orderId: string, items: PongeItem[]): Promise<void> => {
  const sanitized = items.filter(item => item.description && item.description.trim().length > 0);
  if (!sanitized.length) return;

  type ItemInsert = Database['public']['Tables']['custom_order_items']['Insert'];
  const rows: ItemInsert[] = sanitized.map((item, index) => ({
    custom_order_id: orderId,
    description: item.description.trim(),
    position: index,
  }));
  
  const { error } = await customOrderItems().insert(rows);
  if (error) throw error;
};

const insertReferenceMaterials = async (
  orderId: string,
  materials: ReferenceMaterial[]
): Promise<void> => {
  const sanitized = materials.filter(material => material.name && material.name.trim().length > 0);
  if (!sanitized.length) return;

  type MaterialInsert = Database['public']['Tables']['custom_order_reference_materials']['Insert'];
  const rows: MaterialInsert[] = sanitized.map((material, index) => ({
    custom_order_id: orderId,
    name: material.name.trim(),
    description: material.description?.trim() || null,
    quantity: Number.isFinite(material.quantity) ? material.quantity : 1,
    position: index,
  }));
  
  const { error } = await customOrderRefMaterials().insert(rows);
  if (error) throw error;
};

const insertSchedule = async (
  orderId: string,
  schedule: PaymentInstallment[]
): Promise<{ id: string; position: number }[]> => {
  if (!schedule.length) return [];

  type InstallmentInsert = Database['public']['Tables']['custom_order_installments']['Insert'];
  const rows: InstallmentInsert[] = schedule.map((installment, index) => ({
    custom_order_id: orderId,
    due_date: installment.dueDate,
    amount: installment.amount,
    status: toDbInstallmentStatus(installment.status),
    paid_date: installment.paidDate ?? null,
    paid_amount: installment.paidAmount ?? null,
    method: toDbPaymentMethod(installment.method),
    notes: installment.notes ?? null,
    position: index,
  }));

  const { data, error } = await customOrderInstallments()
    .insert(rows)
    .select('id, position');

  if (error) throw error;
  return (data as { id: string; position: number }[]) || [];
};

const insertInitialPayments = async (
  orderId: string,
  schedule: PaymentInstallment[],
  insertedInstallments: { id: string; position: number }[]
): Promise<void> => {
  const paidInstallments = schedule
    .map((installment, index) => ({
      installment,
      position: index,
    }))
    .filter(({ installment }) => installment.status === 'paid');

  if (!paidInstallments.length) {
    return;
  }

  const rows: DbCustomOrderPaymentInsert[] = paidInstallments.map(
    ({ installment, position }) => {
      const installmentId =
        insertedInstallments.find(row => row.position === position)?.id ?? null;
      return {
        custom_order_id: orderId,
        installment_id: installmentId,
        amount: installment.paidAmount ?? installment.amount,
        method: toDbPaymentMethod(installment.method) ?? 'CASH',
        paid_at: toUtcTimestamp(installment.paidDate),
        notes: installment.notes ?? null,
      } as DbCustomOrderPaymentInsert;
    }
  );

  const { error } = await customOrderPayments().insert(rows);
  if (error) throw error;
};

const insertImages = async (orderId: string, files: File[]): Promise<void> => {
  if (!files.length) return;

  const imageUrls = await uploadCustomOrderImages(files, orderId);
  if (!imageUrls.length) return;

  type ImageInsert = Database['public']['Tables']['custom_order_images']['Insert'];
  const rows: ImageInsert[] = imageUrls.map((url, index) => ({
    custom_order_id: orderId,
    url,
    position: index,
  }));
  
  const { error } = await customOrderImages().insert(rows);
  if (error) throw error;
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
    start_date: rest.startDate || null,
    finish_date: rest.finishDate || new Date().toISOString(),
    down_payment: rest.downPayment,
    advance_money: rest.advanceMoney,
    payment_months: rest.paymentMonths,
    total_amount: totalAmount,
    status: toDbStatus(status),
  };

  const { data, error } = await customOrders()
    .insert(insertPayload as DbCustomOrderInsert)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom order', error);
    throw error;
  }

  const createdRow = data as DbCustomOrderRow;
  const orderId = createdRow.id;

  try {
    await insertPongeItems(orderId, rest.pongeItems);
    await insertReferenceMaterials(orderId, rest.referenceMaterials);
    const insertedInstallments = await insertSchedule(orderId, paymentSchedule);
    await insertInitialPayments(orderId, paymentSchedule, insertedInstallments);
    await insertImages(orderId, files);
  } catch (relationError) {
    await customOrders().delete().eq('id', orderId);
    console.error('Error while inserting custom order relations', relationError);
    throw relationError;
  }

  return fetchCustomOrderById(orderId);
};

export const updateCustomOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<Order> => {
  const { error } = await customOrders()
    .update({ status: toDbStatus(status) } as DbCustomOrderUpdate)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating custom order status', error);
    throw error;
  }

  return fetchCustomOrderById(orderId);
};

export const updateCustomOrderSchedule = async (
  orderId: string,
  schedule: PaymentInstallment[],
  status?: OrderStatus
): Promise<Order> => {
  if (schedule.length) {
    type InstallmentUpdate = Database['public']['Tables']['custom_order_installments']['Update'];
    const rows: InstallmentUpdate[] = schedule.map((installment, index) => ({
      id: installment.id,
      custom_order_id: orderId,
      due_date: installment.dueDate,
      amount: installment.amount,
      status: toDbInstallmentStatus(installment.status),
      paid_date: installment.paidDate ?? null,
      paid_amount: installment.paidAmount ?? null,
      method: toDbPaymentMethod(installment.method),
      notes: installment.notes ?? null,
      position: index,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await customOrderInstallments()
      .upsert(rows, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error syncing custom order installments', upsertError);
      throw upsertError;
    }
  }

  if (status) {
    const { error: statusError } = await customOrders()
      .update({ status: toDbStatus(status) } as DbCustomOrderUpdate)
      .eq('id', orderId);

    if (statusError) {
      console.error('Error updating custom order status during schedule sync', statusError);
      throw statusError;
    }
  }

  return fetchCustomOrderById(orderId);
};

export const recordCustomOrderPayment = async (
  input: RecordCustomOrderPaymentInput
): Promise<Order> => {
  const { orderId, installmentId, amount, method, date, notes } = input;
  const dbMethod = toDbPaymentMethod(method) ?? 'CASH';

  const paymentRow: DbCustomOrderPaymentInsert = {
    custom_order_id: orderId,
    installment_id: installmentId,
    amount,
    method: dbMethod,
    paid_at: toUtcTimestamp(date),
    notes: notes || null,
  };

  const { error: paymentError } = await customOrderPayments().insert(paymentRow);

  if (paymentError) {
    console.error('Error recording custom order payment', paymentError);
    throw paymentError;
  }

  type InstallmentUpdate = Database['public']['Tables']['custom_order_installments']['Update'];
  const updateRow: InstallmentUpdate = {
    status: 'PAID',
    paid_date: date,
    paid_amount: amount,
    method: dbMethod,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error: installmentError } = await customOrderInstallments()
    .update(updateRow)
    .eq('id', installmentId)
    .eq('custom_order_id', orderId);

  if (installmentError) {
    console.error('Error updating installment after payment', installmentError);
    throw installmentError;
  }

  const updatedOrder = await fetchCustomOrderById(orderId);
  const allPaid =
    updatedOrder.paymentSchedule &&
    updatedOrder.paymentSchedule.length > 0 &&
    updatedOrder.paymentSchedule.every(installment => installment.status === 'paid');

  if (allPaid && updatedOrder.status !== 'delivered') {
    return updateCustomOrderStatus(orderId, 'delivered');
  }

  return updatedOrder;
};

export const deleteCustomOrder = async (orderId: string): Promise<void> => {
  const { error } = await customOrders().delete().eq('id', orderId);

  if (error) {
    console.error('Error deleting custom order', error);
    throw error;
  }
};

export const fetchUpcomingOrders = async (): Promise<Order[]> => {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(now.getDate() + 7);

  const { data, error } = await customOrders()
    .select(CUSTOM_ORDER_SELECT)
    .eq('status', 'PENDING')
    .gte('start_date', now.toISOString())
    .lte('start_date', weekFromNow.toISOString())
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming orders', error);
    throw error;
  }

  return (data as DbCustomOrderWithRelations[]).map(mapRowToOrder);
};

export const fetchInProgressOrders = async (): Promise<Order[]> => {
  const { data, error } = await customOrders()
    .select(CUSTOM_ORDER_SELECT)
    .eq('status', 'IN_PROGRESS')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching in-progress orders', error);
    throw error;
  }

  return (data as DbCustomOrderWithRelations[]).map(mapRowToOrder);
};

export const calculateTotalPaid = (order: Order): number => {
  if (order.paymentSchedule && order.paymentSchedule.length > 0) {
    return order.paymentSchedule
      .filter(installment => installment.status === 'paid')
      .reduce(
        (sum, installment) => sum + (installment.paidAmount ?? installment.amount),
        0
      );
  }

  const downPayment = order.downPayment || 0;
  const advanceMoney = order.advanceMoney || 0;
  return downPayment + advanceMoney;
};

export const fetchUnpaidOrders = async (): Promise<Order[]> => {
  const { data, error } = await customOrders()
    .select(CUSTOM_ORDER_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching unpaid orders', error);
    throw error;
  }

  const orders = (data as DbCustomOrderWithRelations[]).map(mapRowToOrder);
  return orders.filter(order => calculateTotalPaid(order) < order.totalAmount);
};

