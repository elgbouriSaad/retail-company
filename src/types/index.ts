export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
  isBlocked?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sizes: string[];
  stock: number;
  availability: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  products: OrderItem[];
  status: 'pending' | 'in-progress' | 'delivered';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  size: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  productId?: string;
  createdAt: string;
}

export interface OrderForm {
  clientName: string;
  phoneNumber: string;
  pongeItems: PongeItem[];
  referenceMaterials: ReferenceMaterial[];
  images: File[];
  startDate: string;
  finishDate: string;
  downPayment: number;
  advanceMoney: number;
  paymentMonths: number;
}

export interface PongeItem {
  id: string;
  description: string;
}

export interface ReferenceMaterial {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'consultation' | 'fabric' | 'labor' | 'accessories' | 'other';
}

export interface Payment {
  id: string;
  invoiceId: string;
  method: 'cash' | 'card' | 'check' | 'transfer' | 'mobile';
  amount: number;
  date: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}