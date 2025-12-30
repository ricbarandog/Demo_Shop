
export enum ProductCategory {
  CABINETS = 'Cabinets',
  FLOORING = 'Flooring',
}

export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card',
  CASH = 'Cash on Delivery',
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // e.g., 'sq ft' or 'per unit'
  description: string;
  image: string;
  inStock: boolean;
  stock: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isAdmin?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  timestamp: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  isSameDay?: boolean;
  paymentMethod: PaymentMethod;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DeliverySlot {
  id: string;
  date: string;
  timeRange: string;
  available: boolean;
}
