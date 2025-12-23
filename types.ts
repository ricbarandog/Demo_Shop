export enum ProductCategory {
  CABINETS = 'Cabinets',
  FLOORING = 'Flooring',
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // e.g., 'sq ft' or 'per cabinet'
  description: string;
  image: string;
  inStock: boolean;
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