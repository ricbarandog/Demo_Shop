import { Product, ProductCategory, DeliverySlot } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'c1',
    name: 'Shaker Style White Oak',
    category: ProductCategory.CABINETS,
    price: 350,
    unit: 'per unit',
    description: 'Timeless shaker style cabinets with a durable white oak finish. Soft-close hinges included.',
    image: 'https://picsum.photos/id/1080/400/400',
    inStock: true,
  },
  {
    id: 'c2',
    name: 'Midnight Blue Modern',
    category: ProductCategory.CABINETS,
    price: 420,
    unit: 'per unit',
    description: 'Sleek, matte blue finish for a bold, contemporary kitchen design.',
    image: 'https://picsum.photos/id/401/400/400',
    inStock: true,
  },
  {
    id: 'c3',
    name: 'Classic Cherry Wood',
    category: ProductCategory.CABINETS,
    price: 380,
    unit: 'per unit',
    description: 'Rich, warm tones bringing elegance and tradition to your space.',
    image: 'https://picsum.photos/id/305/400/400',
    inStock: false,
  },
  {
    id: 'f1',
    name: 'Engineered Hardwood - Hickory',
    category: ProductCategory.FLOORING,
    price: 8.50,
    unit: 'sq ft',
    description: 'Hand-scraped engineered hardwood with high durability and water resistance.',
    image: 'https://picsum.photos/id/1070/400/400',
    inStock: true,
  },
  {
    id: 'f2',
    name: 'Luxury Vinyl Plank - Slate Grey',
    category: ProductCategory.FLOORING,
    price: 4.25,
    unit: 'sq ft',
    description: 'Waterproof luxury vinyl plank with a realistic stone texture.',
    image: 'https://picsum.photos/id/859/400/400',
    inStock: true,
  },
  {
    id: 'f3',
    name: 'Porcelain Tile - Carrara Marble',
    category: ProductCategory.FLOORING,
    price: 6.75,
    unit: 'sq ft',
    description: 'Large format porcelain tiles mimicking the elegance of Italian marble.',
    image: 'https://picsum.photos/id/56/400/400',
    inStock: true,
  },
];

// Generate next 5 days of delivery slots
const generateSlots = (): DeliverySlot[] => {
  const slots: DeliverySlot[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    const dateStr = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    slots.push({ id: `slot-${i}-am`, date: dateStr, timeRange: '08:00 AM - 12:00 PM', available: Math.random() > 0.3 });
    slots.push({ id: `slot-${i}-pm`, date: dateStr, timeRange: '01:00 PM - 05:00 PM', available: Math.random() > 0.2 });
  }
  return slots;
};

export const DELIVERY_SLOTS = generateSlots();