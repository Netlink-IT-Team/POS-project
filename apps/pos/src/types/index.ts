export type UserRole = 'visitor' | 'kasir' | 'pic' | 'super_admin';

export interface CategoryItem {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId: string;
  badge?: 'Best Seller' | 'Manual Brew' | 'Snack' | string;
  isAvailable?: boolean;
}

export interface CartLineItem {
  id: string;
  menuId: string;
  name: string;
  modifiersText?: string;
  pricePerUnit: number;
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'qris';
export type PaymentStatus = 'pending' | 'completed';

export interface TransactionSummary {
  orderNumber: string;
  queueNumber: string;
  items: CartLineItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string;
}

