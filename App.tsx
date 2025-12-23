import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Check, Truck, CreditCard, ShieldCheck, HelpCircle, Loader2, Calendar, Lock } from 'lucide-react';
import { PRODUCTS, DELIVERY_SLOTS } from './constants';
import { Product, CartItem, ProductCategory, PaymentMethod, DeliverySlot } from './types';
import { getDesignAdvice } from './services/geminiService';

// --- Sub-components (kept in App.tsx for single-file requirement simplicity, typically separated) ---

const Header: React.FC<{ 
  cartCount: number; 
  onOpenCart: () => void; 
  activeCategory: ProductCategory | 'All';
  onSelectCategory: (c: ProductCategory | 'All') => void;
}> = ({ cartCount, onOpenCart, activeCategory, onSelectCategory }) => (
  <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-700 rounded-sm flex items-center justify-center text-white font-serif font-bold text-lg">O</div>
          <span className="font-serif text-2xl font-bold text-brand-900 tracking-tight">Oak & Stone</span>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <button 
            onClick={() => onSelectCategory('All')}
            className={`text-sm font-medium transition-colors ${activeCategory === 'All' ? 'text-brand-700 border-b-2 border-brand-700' : 'text-gray-500 hover:text-brand-700'}`}
          >
            All Collections
          </button>
          <button 
             onClick={() => onSelectCategory(ProductCategory.CABINETS)}
            className={`text-sm font-medium transition-colors ${activeCategory === ProductCategory.CABINETS ? 'text-brand-700 border-b-2 border-brand-700' : 'text-gray-500 hover:text-brand-700'}`}
          >
            Cabinets
          </button>
          <button 
             onClick={() => onSelectCategory(ProductCategory.FLOORING)}
            className={`text-sm font-medium transition-colors ${activeCategory === ProductCategory.FLOORING ? 'text-brand-700 border-b-2 border-brand-700' : 'text-gray-500 hover:text-brand-700'}`}
          >
            Flooring
          </button>
        </nav>

        <button 
          onClick={onOpenCart}
          className="relative p-2 text-gray-500 hover:text-brand-700 transition-colors"
        >
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-500 rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <div className="relative bg-brand-900 overflow-hidden">
    <div className="absolute inset-0">
      <img 
        src="https://picsum.photos/id/129/1600/600" 
        alt="Modern kitchen" 
        className="w-full h-full object-cover opacity-30"
      />
    </div>
    <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
      <h1 className="text-4xl font-serif font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
        Build Your Dream Space
      </h1>
      <p className="mt-6 text-xl text-brand-100 max-w-3xl">
        Premium cabinetry and durable flooring delivered directly to your job site. 
        Schedule your delivery today with our dedicated fleet.
      </p>
    </div>
  </div>
);

const ProductCard: React.FC<{ product: Product; onAddToCart: (p: Product) => void }> = ({ product, onAddToCart }) => (
  <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
      <img
        src={product.image}
        alt={product.name}
        className="h-64 w-full object-cover object-center group-hover:opacity-90 transition-opacity"
      />
      {!product.inStock && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          Out of Stock
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <h3 className="text-sm text-gray-500 uppercase tracking-wide font-semibold">{product.category}</h3>
      <h2 className="mt-1 text-lg font-serif font-bold text-gray-900">{product.name}</h2>
      <p className="mt-2 text-sm text-gray-600 flex-grow">{product.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xl font-medium text-brand-700">${product.price.toFixed(2)} <span className="text-sm text-gray-500 font-normal">/ {product.unit}</span></p>
        <button
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            product.inStock 
              ? 'bg-brand-700 text-white hover:bg-brand-900' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.inStock ? 'Add to Project' : 'Unavailable'}
        </button>
      </div>
    </div>
  </div>
);

const DesignAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    const advice = await getDesignAdvice(query);
    setResponse(advice);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-700 text-white p-4 rounded-full shadow-xl hover:bg-brand-900 transition-all z-50 flex items-center gap-2"
      >
        <HelpCircle size={24} />
        <span className="font-medium hidden sm:inline">Ask Design AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-fade-in-up">
      <div className="bg-brand-700 p-4 flex justify-between items-center text-white">
        <h3 className="font-serif font-bold flex items-center gap-2"><HelpCircle size={18} /> Design Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-brand-100"><X size={18} /></button>
      </div>
      <div className="p-4 bg-gray-50 h-64 overflow-y-auto">
        {response ? (
          <div className="bg-white p-3 rounded-lg shadow-sm text-sm text-gray-700 border border-gray-100">
            <p className="font-semibold text-brand-700 mb-1">Recommendation:</p>
            {response}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center mt-10">Describe your project (e.g., "dark floors for a bright kitchen") and get instant product suggestions.</p>
        )}
      </div>
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ask about style or materials..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button 
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className="bg-brand-700 text-white px-3 py-2 rounded-md hover:bg-brand-900 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CartSidebar: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  items: CartItem[]; 
  onUpdateQty: (id: string, delta: number) => void;
  onCheckout: () => void;
}> = ({ isOpen, onClose, items, onUpdateQty, onCheckout }) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 bg-brand-50 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-gray-900">Your Project Cart</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} / {item.unit}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="text-gray-400 hover:text-brand-700">-</button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="text-gray-400 hover:text-brand-700">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal</p>
              <p>${subtotal.toFixed(2)}</p>
            </div>
            <p className="text-xs text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <button
              onClick={onCheckout}
              disabled={items.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-md border border-transparent bg-brand-700 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout <Lock size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const CheckoutModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  total: number;
  onPlaceOrder: (details: any) => void;
}> = ({ isOpen, onClose, total, onPlaceOrder }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [loading, setLoading] = useState(false);

  // Form states
  const [contact, setContact] = useState({ name: '', email: '', address: '', phone: '' });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && (!contact.name || !contact.email || !contact.address)) return alert("Please fill in details");
    if (step === 2 && !selectedSlot) return alert("Please select a delivery slot");
    if (step < 3) setStep(prev => (prev + 1) as any);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate secure processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    onPlaceOrder({ contact, selectedSlot, paymentMethod, total });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">
        
        {/* Progress Sidebar */}
        <div className="bg-brand-50 p-6 md:w-1/3 border-r border-gray-100">
          <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">Secure Checkout</h2>
          <div className="space-y-6">
            <div className={`flex items-center gap-3 ${step === 1 ? 'text-brand-700 font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 1 ? 'border-brand-700 bg-white' : 'border-gray-300'}`}>1</div>
              <span>Details</span>
            </div>
            <div className={`flex items-center gap-3 ${step === 2 ? 'text-brand-700 font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 2 ? 'border-brand-700 bg-white' : 'border-gray-300'}`}>2</div>
              <span>Delivery</span>
            </div>
            <div className={`flex items-center gap-3 ${step === 3 ? 'text-brand-700 font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 3 ? 'border-brand-700 bg-white' : 'border-gray-300'}`}>3</div>
              <span>Payment</span>
            </div>
          </div>
          <div className="mt-10 p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Order Total</p>
            <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 md:w-2/3">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
          
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact & Shipping</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" className="border p-3 rounded w-full" value={contact.name} onChange={e => setContact({...contact, name: e.target.value})} />
                <input type="text" placeholder="Phone Number" className="border p-3 rounded w-full" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} />
              </div>
              <input type="email" placeholder="Email Address" className="border p-3 rounded w-full" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} />
              <textarea placeholder="Delivery Address" className="border p-3 rounded w-full h-24" value={contact.address} onChange={e => setContact({...contact, address: e.target.value})} />
              <button onClick={handleNext} className="w-full bg-brand-700 text-white py-3 rounded hover:bg-brand-900 font-medium">Next: Schedule Delivery</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule Your Delivery</h3>
              <p className="text-sm text-gray-500 mb-4">Select a time slot based on our truck availability.</p>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {DELIVERY_SLOTS.map(slot => (
                  <button 
                    key={slot.id}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-4 border rounded-lg text-left flex justify-between items-center transition-all ${
                      selectedSlot === slot.id 
                        ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' 
                        : slot.available ? 'border-gray-200 hover:border-brand-500' : 'bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{slot.date}</p>
                      <p className="text-sm text-gray-500">{slot.timeRange}</p>
                    </div>
                    {slot.available ? (selectedSlot === slot.id && <Check className="text-brand-700" />) : <span className="text-xs text-red-500 font-bold uppercase">Booked</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-300 rounded text-gray-700">Back</button>
                <button onClick={handleNext} className="flex-1 bg-brand-700 text-white py-3 rounded hover:bg-brand-900 font-medium">Next: Secure Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock size={20} className="text-green-600" /> Secure Payment
              </h3>
              
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {[PaymentMethod.CREDIT_CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.E_CHECK].map(m => (
                  <button 
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${paymentMethod === m ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod === PaymentMethod.CREDIT_CARD && (
                <div className="space-y-4 animate-fade-in">
                  <input type="text" placeholder="Card Number" className="border p-3 rounded w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM / YY" className="border p-3 rounded w-full" />
                    <input type="text" placeholder="CVC" className="border p-3 rounded w-full" />
                  </div>
                </div>
              )}

              {paymentMethod === PaymentMethod.BANK_TRANSFER && (
                <div className="space-y-4 animate-fade-in p-4 bg-gray-50 rounded border text-sm text-gray-600">
                  <p>Upon order placement, you will receive an invoice with our wire details.</p>
                  <p className="font-bold">Your delivery slot is reserved for 24 hours pending payment confirmation.</p>
                </div>
              )}

               {paymentMethod === PaymentMethod.E_CHECK && (
                <div className="space-y-4 animate-fade-in">
                   <input type="text" placeholder="Routing Number" className="border p-3 rounded w-full" />
                   <input type="text" placeholder="Account Number" className="border p-3 rounded w-full" />
                   <div className="flex items-center gap-2 text-xs text-gray-500">
                     <ShieldCheck size={14} /> Bank-level encryption enabled.
                   </div>
                </div>
              )}

              <div className="bg-green-50 text-green-800 p-3 rounded text-sm flex items-center gap-2">
                <ShieldCheck size={18} />
                <span>SSL Encrypted Transaction. Your data is safe.</span>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => setStep(2)} className="px-6 py-3 border border-gray-300 rounded text-gray-700">Back</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1 bg-brand-700 text-white py-3 rounded hover:bg-brand-900 font-medium flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : `Pay $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'All'>('All');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const filteredProducts = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-600 mb-6">Your materials are reserved. A confirmation email has been sent with your delivery details.</p>
          <button 
            onClick={() => { setCart([]); setOrderComplete(false); setIsCheckoutOpen(false); }}
            className="w-full bg-brand-700 text-white py-3 rounded hover:bg-brand-900"
          >
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />
      
      <Hero />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-gray-900">Featured Products</h2>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select className="text-sm border-none bg-transparent font-medium text-brand-700 cursor-pointer focus:ring-0">
              <option>Popularity</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>

        <div className="mt-16 bg-white rounded-xl shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-gray-100">
            <div className="flex-1">
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Need Installation?</h3>
                <p className="text-gray-600">We partner with top-rated local contractors. Add installation service to your quote after checkout.</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-brand-700 font-medium">
                    <Truck size={20} />
                    <span>Nationwide Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-brand-700 font-medium">
                    <ShieldCheck size={20} />
                    <span>5-Year Warranty</span>
                </div>
            </div>
        </div>
      </main>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart} 
        onUpdateQty={updateQuantity}
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        total={cartTotal}
        onPlaceOrder={() => setOrderComplete(true)}
      />

      <DesignAssistant />
    </div>
  );
}