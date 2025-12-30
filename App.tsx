
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, X, Check, Truck, CreditCard, ShieldCheck, 
  HelpCircle, Loader2, Calendar, Lock, LayoutDashboard, Package, 
  Users, BarChart3, Plus, Edit2, LogOut, User as UserIcon,
  ArrowRight, Search, AlertCircle, Upload, Link as LinkIcon, 
  Maximize2, Zap, History, Banknote, CreditCard as CardIcon,
  Trash2, MapPin, Phone
} from 'lucide-react';
import { INITIAL_PRODUCTS, DELIVERY_SLOTS, MOCK_USERS, MOCK_ORDERS } from './constants';
import { Product, CartItem, ProductCategory, User, Order, PaymentMethod } from './types';
import { getDesignAdvice } from './services/geminiService';

// --- Utilities ---

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const useStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        alert("Storage limit reached. Try a smaller file.");
      }
    }
  }, [key, value]);

  return [value, setValue] as const;
};

// --- Components ---

const ImageLightbox: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => (
  <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
    <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
      <X size={32} />
    </button>
    <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="h-full aspect-square md:aspect-auto">
        <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
      </div>
      <div className="p-8 space-y-6">
        <div>
          <span className="text-brand-500 text-[10px] font-bold uppercase tracking-widest block mb-2">{product.category}</span>
          <h2 className="text-3xl font-serif font-bold text-slate-900">{product.name}</h2>
        </div>
        <p className="text-2xl font-bold text-brand-700">${product.price.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ {product.unit}</span></p>
        <p className="text-slate-600 leading-relaxed">{product.description}</p>
        <div className="pt-4">
          <button onClick={onClose} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all">Close</button>
        </div>
      </div>
    </div>
  </div>
);

const UserHistoryModal: React.FC<{ isOpen: boolean; onClose: () => void; orders: Order[]; user: User | null }> = ({ isOpen, onClose, orders, user }) => {
  const userOrders = useMemo(() => orders.filter(o => o.userId === user?.id), [orders, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col h-[70vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Purchase History</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Your previous orders</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {userOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-300">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No orders found.</p>
            </div>
          ) : (
            userOrders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(order => (
              <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-brand-700 uppercase">Order #{order.id}</span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-1">
                   {order.items.map((item, i) => (
                     <div key={i} className="text-xs text-slate-600 flex justify-between">
                       <span>{item.name} x{item.quantity}</span>
                       <span>${(item.price * item.quantity).toFixed(2)}</span>
                     </div>
                   ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs text-slate-400 italic">{new Date(order.timestamp).toLocaleString()}</span>
                  <span className="font-bold text-slate-900">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useStorage<Product[]>('oak_stone_products', INITIAL_PRODUCTS);
  const [orders, setOrders] = useStorage<Order[]>('oak_stone_orders', MOCK_ORDERS);
  const [users, setUsers] = useStorage<User[]>('oak_stone_users', MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'All'>('All');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [selectedProductForView, setSelectedProductForView] = useState<Product | null>(null);
  const [isSameDay, setIsSameDay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);

  // Filtered lists
  const filteredProducts = useMemo(() => 
    activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory)
  , [activeCategory, products]);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  // Auth & Cart
  const addToCart = (product: Product) => {
    if (currentUser?.isAdmin) {
      alert("Admin accounts cannot purchase products. Please use a customer account.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const p = products.find(prod => prod.id === id);
        return { ...item, quantity: Math.max(0, Math.min(p?.stock || 0, item.quantity + delta)) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const finalizeCheckout = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      items: [...cart],
      total: cartTotal,
      timestamp: new Date().toISOString(),
      status: 'Pending',
      isSameDay: isSameDay,
      paymentMethod: paymentMethod
    };

    setOrders(prev => [...prev, newOrder]);
    setProducts(products.map(p => {
      const item = cart.find(ci => ci.id === p.id);
      if (item) {
        const n = Math.max(0, p.stock - item.quantity);
        return { ...p, stock: n, inStock: n > 0 };
      }
      return p;
    }));
    setOrderComplete(true);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsSameDay(false);
  };

  if (view === 'admin') {
    return <AdminDashboard 
      products={products} 
      orders={orders} 
      users={users} 
      onUpdateProducts={setProducts} 
      onExit={() => setView('store')} 
    />;
  }

  return (
    <div className="min-h-screen bg-brand-50 pb-20 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveCategory('All')}>
            <div className="w-8 h-8 bg-brand-900 rounded flex items-center justify-center text-white font-serif font-bold">O</div>
            <span className="font-serif text-xl font-bold tracking-tight text-slate-900">Oak & Stone</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            {['All', ProductCategory.CABINETS, ProductCategory.FLOORING].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat as any)}
                className={`text-sm font-medium transition-colors ${activeCategory === cat ? 'text-brand-700' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {currentUser?.isAdmin && (
              <button onClick={() => setView('admin')} className="flex items-center gap-2 text-xs font-bold text-brand-700 bg-brand-50 px-3 py-2 rounded-lg hover:bg-brand-100 transition-all">
                <LayoutDashboard size={14} /> Dashboard
              </button>
            )}
            
            {currentUser ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setIsHistoryOpen(true)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <History size={20} />
                </button>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <span className="text-xs font-bold text-slate-900">{currentUser.name.split(' ')[0]}</span>
                  <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="text-sm font-bold text-brand-700 hover:text-brand-900">Login</button>
            )}

            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-700 hover:text-brand-700 transition-colors">
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-brand-700 text-white text-[10px] flex items-center justify-center rounded-full border border-white font-bold">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[450px] flex items-center justify-center bg-brand-900 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1556912177-c54857056a41?q=80&w=1920&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-transparent to-brand-900/50" />
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">Built for Generations.</h1>
          <p className="text-lg md:text-xl text-brand-100/70 mb-10 font-light">Exquisite cabinetry and premium flooring solutions for the modern home.</p>
          <button onClick={() => document.getElementById('catalog')?.scrollIntoView({behavior: 'smooth'})} className="bg-brand-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center gap-2 mx-auto shadow-xl">
            View Collection <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main id="catalog" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Sidebar / Filters */}
          <aside className="space-y-10">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Delivery Schedule</h3>
              <div className="space-y-4">
                {DELIVERY_SLOTS.slice(0, 3).map(slot => (
                  <div key={slot.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-2 bg-brand-50 text-brand-700 rounded-lg"><Truck size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{slot.date}</p>
                      <p className="text-[10px] text-slate-400">{slot.timeRange}</p>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 italic text-center">Same-day delivery available for ready stock.</p>
              </div>
            </div>
            
            <div className="p-6 bg-slate-900 rounded-3xl text-white">
              <h3 className="font-serif text-lg font-bold mb-4">Project Help?</h3>
              <p className="text-sm text-brand-100/60 mb-6">Our AI design assistant can help you pick the perfect materials.</p>
              {/* Fixed: Invalid 'bottom' property in window.scrollTo. Replaced with 'top: document.documentElement.scrollHeight' to scroll to bottom. */}
              <button onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-bold transition-all border border-white/10">Ask AI Consultant</button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="md:col-span-3">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-serif font-bold text-slate-900">{activeCategory}</h2>
               <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input placeholder="Search catalog..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all bg-white" />
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredProducts.map(product => (
                 <div key={product.id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => setSelectedProductForView(product)}>
                     <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                     <div className="absolute top-4 right-4 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl">
                       <Maximize2 size={16} className="text-slate-600" />
                     </div>
                   </div>
                   <div className="p-6">
                     <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{product.category}</span>
                       {!product.inStock && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Out of Stock</span>}
                     </div>
                     <h4 className="text-lg font-bold text-slate-900 mb-4">{product.name}</h4>
                     <div className="flex items-center justify-between mt-auto">
                       <p className="font-bold text-slate-900">${product.price.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ {product.unit}</span></p>
                       <button 
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock}
                        className={`p-3 rounded-xl transition-all ${product.inStock ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-100 text-slate-300'}`}
                       >
                         <Plus size={20} />
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={user => { setCurrentUser(user); setIsAuthOpen(false); if (cart.length > 0) setIsCartOpen(true); }} 
        users={users}
        onRegister={newUser => setUsers(prev => [...prev, newUser])}
      />
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        onUpdateQuantity={updateQuantity} 
        total={cartTotal} 
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
      />
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cart={cart} 
        total={cartTotal} 
        user={currentUser} 
        isSameDay={isSameDay}
        setIsSameDay={setIsSameDay}
        onPay={finalizeCheckout}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      {selectedProductForView && <ImageLightbox product={selectedProductForView} onClose={() => setSelectedProductForView(null)} />}
      <UserHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} orders={orders} user={currentUser} />
      {orderComplete && <SuccessOverlay onClose={() => setOrderComplete(false)} />}
      <DesignAssistant />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}

// --- Specific Sub-components ---

const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: (u: User) => void; users: User[]; onRegister: (u: User) => void }> = ({ isOpen, onClose, onSuccess, users, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '', phone: '' });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (user) {
        onSuccess(user);
      } else {
        setError("Account not found. Please sign up.");
      }
    } else {
      if (!formData.name || !formData.email || !formData.address || !formData.phone) {
        setError("All fields are required.");
        return;
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        isAdmin: false
      };
      onRegister(newUser);
      onSuccess(newUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-md p-10 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X /></button>
        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8">{isLogin ? 'Login' : 'Join Oak & Stone'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              placeholder="Full Name" 
              className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          )}
          <input 
            placeholder="Email Address" 
            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password"
            placeholder="Password" 
            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none" 
          />
          {!isLogin && (
            <>
              <input 
                placeholder="Phone Number" 
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
              <textarea 
                placeholder="Complete Delivery Address" 
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none h-24 resize-none" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </>
          )}

          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}

          <button type="submit" className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg mt-4">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          {isLogin ? "New to the platform?" : "Already have an account?"}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-1 text-brand-700 font-bold hover:underline">
            {isLogin ? 'Create Account' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

const CartDrawer: React.FC<{ isOpen: boolean; onClose: () => void; cart: CartItem[]; onUpdateQuantity: (id: string, d: number) => void; total: number; onCheckout: () => void }> = ({ isOpen, onClose, cart, onUpdateQuantity, total, onCheckout }) => (
  <div className={`fixed inset-0 z-50 transition-all duration-500 ${isOpen ? 'visible' : 'invisible'}`}>
    <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
    <div className={`absolute right-0 top-0 h-full w-full sm:w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-serif font-bold text-slate-900">Your Cart</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={28} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <ShoppingCart size={64} className="mb-4 opacity-20" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-6 group">
                <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-50">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{item.category}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center bg-slate-50 rounded-lg p-1">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-brand-700 transition-colors">-</button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:text-brand-700 transition-colors">+</button>
                    </div>
                    <p className="text-sm font-bold text-slate-900 ml-auto">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between text-xl font-serif font-bold text-slate-900 mb-8">
            <p>Total</p>
            <p>${total.toFixed(2)}</p>
          </div>
          <button 
            onClick={onCheckout}
            disabled={cart.length === 0} 
            className="w-full bg-brand-900 text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:grayscale"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CheckoutModal: React.FC<{ 
  isOpen: boolean; onClose: () => void; cart: CartItem[]; total: number; 
  user: User | null; isSameDay: boolean; setIsSameDay: (v: boolean) => void;
  onPay: () => void; paymentMethod: PaymentMethod; setPaymentMethod: (m: PaymentMethod) => void 
}> = ({ isOpen, onClose, cart, total, user, isSameDay, setIsSameDay, onPay, paymentMethod, setPaymentMethod }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-10 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-serif font-bold text-slate-900">Secure Checkout</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-10">
          {/* Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Project Summary</h3>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name} x{item.quantity}</span>
                  <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between font-bold text-lg text-slate-900">
                <span>Total Amount</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Details</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                <MapPin className="text-brand-500 flex-shrink-0" size={18} />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Shipping To:</p>
                  <p className="text-slate-500 mt-1">{user?.address || 'Sign in to add address'}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                <Phone className="text-brand-500 flex-shrink-0" size={18} />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Contact Number:</p>
                  <p className="text-slate-500 mt-1">{user?.phone || 'Sign in to add phone'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fulfillment</h3>
              <button 
                onClick={() => setIsSameDay(!isSameDay)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${isSameDay ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3">
                  <Zap className={isSameDay ? 'text-amber-500' : 'text-slate-400'} size={20} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Same-Day Processing</p>
                    <p className="text-[10px] text-slate-400 italic">Available for in-stock items</p>
                  </div>
                </div>
                {isSameDay && <Check className="text-amber-500" size={20} />}
              </button>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-slate-100 text-slate-400'}`}
               >
                 <CardIcon size={24} />
                 <span className="text-xs font-bold">Credit Card</span>
               </button>
               <button 
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-slate-100 text-slate-400'}`}
               >
                 <Banknote size={24} />
                 <span className="text-xs font-bold">Cash on Delivery</span>
               </button>
            </div>

            {paymentMethod === PaymentMethod.CREDIT_CARD && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 animate-fade-in">
                <input placeholder="Card Number" className="col-span-2 w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
                <input placeholder="MM/YY" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
                <input placeholder="CVC" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none" />
                <div className="col-span-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <ShieldCheck size={14} className="text-green-500" /> Secure SSL Encrypted Payment
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
           <button 
            onClick={onPay}
            disabled={!user}
            className="w-full bg-brand-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {user ? `Pay $${total.toFixed(2)}` : 'Sign in to Pay'}
             <ArrowRight size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};

const SuccessOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-brand-900/90 backdrop-blur-xl animate-fade-in">
    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-16 text-center scale-in">
       <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
         <Check size={48} className="text-green-600" />
       </div>
       <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Confirmed!</h2>
       <p className="text-slate-400 mb-10 leading-relaxed">Your order is being processed. You can track your staging and delivery status in your profile history.</p>
       <button onClick={onClose} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl">Back to Gallery</button>
    </div>
  </div>
);

const DesignAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setAdvice(null);
    try {
      const result = await getDesignAdvice(query);
      setAdvice(result);
    } catch (err) {
      setAdvice("Our design experts are currently away. Please try again soon.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen ? (
        <div className="bg-white rounded-3xl shadow-2xl w-80 sm:w-96 border border-slate-100 overflow-hidden flex flex-col max-h-[500px] animate-fade-in">
          <div className="p-4 bg-brand-900 text-white flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><HelpCircle size={16} /> AI Consultant</span>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto bg-brand-50 flex-1 min-h-[150px]">
            {advice && <div className="bg-white p-5 rounded-2xl border-l-4 border-brand-700 text-sm leading-relaxed shadow-sm text-slate-700">{advice}</div>}
            {isLoading && <div className="flex justify-center mt-4"><Loader2 className="animate-spin text-brand-700" size={24} /></div>}
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask about materials..." className="flex-1 text-sm bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" />
            <button type="submit" className="bg-brand-900 text-white p-3 rounded-xl hover:bg-black transition-all"><ArrowRight size={20} /></button>
          </form>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="bg-brand-900 text-white p-5 rounded-full shadow-2xl hover:scale-105 transition-transform"><HelpCircle size={28} /></button>
      )}
    </div>
  );
};

// --- Admin Dashboard ---

const AdminDashboard: React.FC<{
  products: Product[];
  orders: Order[];
  users: User[];
  onUpdateProducts: (products: Product[]) => void;
  onExit: () => void;
}> = ({ products, orders, users, onUpdateProducts, onExit }) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'inventory' | 'orders' | 'users'>('kpi');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kpis = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStockCount = products.filter(p => p.stock < 10).length;
    return { 
      totalSales, 
      totalOrders: orders.length, 
      lowStockCount, 
      totalUsers: users.length,
      avgOrderValue: orders.length > 0 ? totalSales / orders.length : 0
    };
  }, [orders, products, users]);

  useEffect(() => {
    if (editingProduct) setImagePreview(editingProduct.image);
    else if (isAddingNew) setImagePreview(null);
  }, [editingProduct, isAddingNew]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImagePreview(compressed);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct?.id || `p-${Date.now()}`,
      name: formData.get('name') as string,
      category: formData.get('category') as ProductCategory,
      price: parseFloat(formData.get('price') as string),
      unit: formData.get('unit') as string,
      stock: parseInt(formData.get('stock') as string),
      description: formData.get('description') as string,
      image: imagePreview || (formData.get('image_url') as string) || 'https://picsum.photos/400/400',
      inStock: parseInt(formData.get('stock') as string) > 0,
    };
    if (editingProduct) onUpdateProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
    else onUpdateProducts([...products, newProduct]);
    closeModal();
  };

  const deleteProduct = (id: string) => {
    if (window.confirm("Delete this product permanently?")) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const closeModal = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setImagePreview(null);
    setIsCompressing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-xs font-bold">O</div>
            <h2 className="text-xl font-serif font-bold">Admin Console</h2>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold opacity-50">Project Management</p>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'kpi', icon: BarChart3, label: 'Performance' },
            { id: 'inventory', icon: Package, label: 'Products' },
            { id: 'orders', icon: Truck, label: 'Orders' },
            { id: 'users', icon: Users, label: 'Customers' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-brand-700 text-white shadow-lg shadow-brand-700/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
           <button onClick={onExit} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            <LogOut size={16} /> Exit Dashboard
          </button>
        </div>
      </div>

      {/* Admin Main View */}
      <div className="flex-1 ml-64 min-h-screen">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-10 sticky top-0 z-40">
          <h1 className="text-2xl font-serif font-bold text-slate-900 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Calendar size={14} /> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {activeTab === 'kpi' && (
            <div className="space-y-10 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit mb-4"><CreditCard size={24} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Sales</p>
                    <h3 className="text-3xl font-serif font-bold text-slate-900">${kpis.totalSales.toLocaleString()}</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="p-3 bg-brand-50 text-brand-700 rounded-xl w-fit mb-4"><Truck size={24} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Orders</p>
                    <h3 className="text-3xl font-serif font-bold text-slate-900">{kpis.totalOrders}</h3>
                  </div>
                </div>
                <div className={`bg-white p-8 rounded-3xl shadow-sm border flex flex-col justify-between ${kpis.lowStockCount > 0 ? 'border-red-100' : 'border-slate-100'}`}>
                  <div className={`p-3 rounded-xl w-fit mb-4 ${kpis.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><Package size={24} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Low Stock</p>
                    <h3 className="text-3xl font-serif font-bold text-slate-900">{kpis.lowStockCount}</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4"><Users size={24} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Customers</p>
                    <h3 className="text-3xl font-serif font-bold text-slate-900">{kpis.totalUsers}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-10 flex flex-col items-center justify-center text-center">
                 <BarChart3 size={48} className="text-slate-200 mb-6" />
                 <h4 className="text-xl font-serif font-bold text-slate-900 mb-2">High Performance Staging</h4>
                 <p className="text-sm text-slate-400 max-w-sm">Detailed sales velocity and inventory forecasting analytics are calculated in real-time as transactions occur.</p>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">Product Management</h3>
                <button onClick={() => setIsAddingNew(true)} className="bg-brand-900 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-all">
                  <Plus size={16} /> Add Product
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-8 py-5">Product</th>
                      <th className="px-8 py-5">Category</th>
                      <th className="px-8 py-5">Price</th>
                      <th className="px-8 py-5">Stock</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-brand-50/50 transition-colors">
                        <td className="px-8 py-4 flex items-center gap-4">
                          <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-bold text-slate-800">{p.name}</span>
                        </td>
                        <td className="px-8 py-4 text-xs font-medium text-slate-500 uppercase tracking-widest">{p.category}</td>
                        <td className="px-8 py-4 font-bold text-slate-900">${p.price.toFixed(2)}</td>
                        <td className="px-8 py-4 font-bold text-slate-700">{p.stock}</td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingProduct(p)} className="p-2 text-slate-400 hover:text-brand-700 hover:bg-white rounded-lg transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
               <div className="p-8 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900">All Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-8 py-5">Order ID</th>
                      <th className="px-8 py-5">Customer</th>
                      <th className="px-8 py-5">Payment</th>
                      <th className="px-8 py-5">Priority</th>
                      <th className="px-8 py-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(o => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-mono text-brand-700 font-bold">#{o.id}</td>
                        <td className="px-8 py-5 font-bold text-slate-800">{o.userName}</td>
                        <td className="px-8 py-5 text-xs text-slate-500 uppercase tracking-widest font-bold">{o.paymentMethod}</td>
                        <td className="px-8 py-5">
                          {o.isSameDay ? <span className="text-amber-500 flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest"><Zap size={12} /> Same Day</span> : <span className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">Standard</span>}
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-slate-900">${o.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900">User Directory</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-8 py-5">Name</th>
                      <th className="px-8 py-5">Email</th>
                      <th className="px-8 py-5">Address</th>
                      <th className="px-8 py-5">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                        <td className="px-8 py-5 text-slate-600 text-sm">{u.email}</td>
                        <td className="px-8 py-5 text-slate-400 text-xs truncate max-w-[200px]">{u.address}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.isAdmin ? 'bg-brand-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {u.isAdmin ? 'Admin' : 'Customer'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Edit Modal */}
      {(editingProduct || isAddingNew) && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="md:w-5/12 bg-slate-50 p-8 flex flex-col items-center justify-center border-r border-slate-100">
               <div className="w-full aspect-square rounded-3xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                  {imagePreview ? <img src={imagePreview} className={`w-full h-full object-cover ${isCompressing ? 'opacity-30' : 'opacity-100'}`} /> : <Package size={48} className="text-slate-200" />}
                  {isCompressing && <Loader2 className="absolute animate-spin text-brand-700" size={32} />}
                  <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Upload size={14} /> Upload Image</span>
                  </button>
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <form onSubmit={saveProduct} className="space-y-4">
                <input name="name" defaultValue={editingProduct?.name} placeholder="Name" className="w-full bg-slate-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-500" required />
                <select name="category" defaultValue={editingProduct?.category} className="w-full bg-slate-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-500 appearance-none">
                  <option value={ProductCategory.CABINETS}>Cabinets</option>
                  <option value={ProductCategory.FLOORING}>Flooring</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="Price" className="w-full bg-slate-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-500" required />
                  <input name="stock" type="number" defaultValue={editingProduct?.stock} placeholder="Stock" className="w-full bg-slate-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-500" required />
                </div>
                <textarea name="description" defaultValue={editingProduct?.description} placeholder="Description" className="w-full bg-slate-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-500 h-28" required />
                <button type="submit" disabled={isCompressing} className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all mt-4">Save Product</button>
                <button type="button" onClick={closeModal} className="w-full text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">Cancel</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
