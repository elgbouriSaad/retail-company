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
  categoryId?: string;
  images: string[];
  sizes: string[];
  stock: number;
  availability: boolean;
  createdAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  articleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
  method?: 'cash' | 'card' | 'check' | 'transfer' | 'mobile';
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  products: OrderItem[];
  status: 'pending' | 'in-progress' | 'delivered';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  phoneNumber?: string;
  pongeItems?: PongeItem[];
  referenceMaterials?: ReferenceMaterial[];
  startDate?: string;
  finishDate?: string;
  actualDeliveryDate?: string;
  downPayment?: number;
  advanceMoney?: number;
  paymentMonths?: number;
  images?: string[];
  invoiceReference?: string;
  paymentSchedule?: PaymentInstallment[];
  categoryId?: string;
  categoryName?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  size: string;
  price: number;
}

// CartItem interface removed - cart functionality not used
// ContactMessage interface removed - contact_messages table deleted

export interface OrderForm {
  clientName: string;
  phoneNumber: string;
  pongeItems: PongeItem[];
  referenceMaterials: ReferenceMaterial[];
  images: File[];
  startDate: string;
  finishDate: string;
  actualDeliveryDate: string;
  downPayment: number;
  advanceMoney: number;
  paymentMonths: number;
  categoryId: string;
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

// Invoice, InvoiceItem, and Payment interfaces removed - tables were deleted
// Payment functionality is now handled through custom_order_payments