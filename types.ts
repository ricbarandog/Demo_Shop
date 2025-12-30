
export enum ProductCategory {
  CABINETS = 'Cabinets',
  FLOORING = 'Flooring',
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
  stock: number; // Added for inventory management
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
  status: 'Pending' | 'Delivered' | 'Cancelled';
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

export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card',
  DEBIT_CARD = 'Debit Card',
  BANK_TRANSFER = 'Bank Transfer',
  E_CHECK = 'e-Check',
}
