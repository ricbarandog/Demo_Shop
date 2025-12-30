
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, X, Check, Truck, CreditCard, ShieldCheck, 
  HelpCircle, Loader2, Calendar, Lock, LayoutDashboard, Package, 
  Users, BarChart3, Plus, Edit2, LogOut, User as UserIcon,
  ArrowRight, Search, AlertCircle, Upload, Link as LinkIcon
} from 'lucide-react';
import { INITIAL_PRODUCTS, DELIVERY_SLOTS, MOCK_USERS, MOCK_ORDERS } from './constants';
import { Product, CartItem, ProductCategory, User, Order } from './types';
import { getDesignAdvice } from './services/geminiService';

// --- Persistent State Utility ---
const useStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
};

// --- Sub-components ---

const Header: React.FC<{ 
  cartCount: number; 
  onOpenCart: () => void; 
  activeCategory: ProductCategory | 'All';
  onSelectCategory: (c: ProductCategory | 'All') => void;
  currentUser: User | null;
  onLogout: () => void;
  onLogin: () => void;
  onAdminClick: () => void;
}> = ({ cartCount, onOpenCart, activeCategory, onSelectCategory, currentUser, onLogout, onLogin, onAdminClick }) => (
  <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectCategory('All')}>
          <div className="w-8 h-8 bg-brand-700 rounded-sm flex items-center justify-center text-white font-serif font-bold text-lg">O</div>
          <span className="font-serif text-2xl font-bold text-brand-900 tracking-tight">Oak & Stone</span>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          {['All', ProductCategory.CABINETS, ProductCategory.FLOORING].map((cat) => (
            <button 
              key={cat}
              onClick={() => onSelectCategory(cat as any)}
              className={`text-sm font-medium transition-colors pb-1 ${activeCategory === cat ? 'text-brand-700 border-b-2 border-brand-700' : 'text-gray-500 hover:text-brand-700'}`}
            >
              {cat === 'All' ? 'All Collections' : cat}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {currentUser?.isAdmin && (
            <button onClick={onAdminClick} className="flex items-center gap-2 text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-all">
              <LayoutDashboard size={16} /> Admin
            </button>
          )}

          <div className="h-6 w-px bg-gray-200" />

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.name}</p>
                <button onClick={onLogout} className="text-[10px] text-gray-500 hover:text-red-600 uppercase tracking-widest font-bold">Logout</button>
              </div>
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700">
                <UserIcon size={18} />
              </div>
            </div>
          ) : (
            <button onClick={onLogin} className="text-sm font-bold text-brand-700 hover:text-brand-900">Sign In</button>
          )}

          <button onClick={onOpenCart} className="relative p-2 text-gray-500 hover:text-brand-700 transition-colors">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-500 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  </header>
);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kpis = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStockCount = products.filter(p => p.stock < 10).length;
    return { totalSales, totalOrders: orders.length, lowStockCount, totalUsers: users.length };
  }, [orders, products, users]);

  useEffect(() => {
    if (editingProduct) setImagePreview(editingProduct.image);
    else if (isAddingNew) setImagePreview(null);
  }, [editingProduct, isAddingNew]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
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

    if (editingProduct) {
      onUpdateProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      onUpdateProducts([...products, newProduct]);
    }
    closeModal();
  };

  const closeModal = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-xs font-bold">O</div>
            <h2 className="text-xl font-serif font-bold text-white">Management</h2>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Operations Console</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'kpi', icon: BarChart3, label: 'Analytics' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'orders', icon: Truck, label: 'Transactions' },
            { id: 'users', icon: Users, label: 'Customer Base' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id ? 'bg-brand-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={onExit} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            <LogOut size={18} /> Back to Store
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 min-h-screen">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-2xl font-serif font-bold text-slate-800 capitalize">{activeTab} View</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <Calendar size={16} /> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'kpi' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:border-brand-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><CreditCard size={24} /></div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12.5%</span>
                  </div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Total Revenue</p>
                  <h3 className="text-3xl font-serif font-bold text-slate-900 mt-1">${kpis.totalSales.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:border-brand-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-brand-50 text-brand-700 rounded-xl group-hover:scale-110 transition-transform"><Truck size={24} /></div>
                  </div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Orders Fulfilled</p>
                  <h3 className="text-3xl font-serif font-bold text-slate-900 mt-1">{kpis.totalOrders}</h3>
                </div>
                <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all group hover:border-brand-500 ${kpis.lowStockCount > 0 ? 'border-red-100 bg-red-50/10' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${kpis.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      <AlertCircle size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Stock Alerts</p>
                  <h3 className="text-3xl font-serif font-bold text-slate-900 mt-1">{kpis.lowStockCount}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:border-brand-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
                  </div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Active Customers</p>
                  <h3 className="text-3xl font-serif font-bold text-slate-900 mt-1">{kpis.totalUsers}</h3>
                </div>
              </div>
              
              {/* Recent Activity Placeholder */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Operational Momentum</h3>
                  <div className="text-xs text-brand-700 font-bold uppercase tracking-widest">Real-time Feed</div>
                </div>
                <div className="p-12 text-center text-slate-400">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Extended analytics visualization will populate as more orders arrive.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800">Master Catalog</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Edit products or manage supply quantities.</p>
                </div>
                <button 
                  onClick={() => setIsAddingNew(true)}
                  className="bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-900 shadow-lg shadow-brand-700/20 transition-all"
                >
                  <Plus size={16} /> Add New Asset
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold">
                      <th className="px-6 py-5">Product Details</th>
                      <th className="px-6 py-5">Classification</th>
                      <th className="px-6 py-5">MSRP</th>
                      <th className="px-6 py-5">Available Stock</th>
                      <th className="px-6 py-5">Market Status</th>
                      <th className="px-6 py-5 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-brand-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                              <img src={p.image} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{p.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">${p.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${p.stock < 10 ? 'text-red-600' : 'text-slate-700'}`}>
                              {p.stock.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{p.unit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.inStock ? 'On Shelf' : 'Stocked Out'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setEditingProduct(p)} className="text-slate-300 hover:text-brand-700 p-2 hover:bg-white rounded-lg transition-all"><Edit2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Project Transactions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Historical log of all secure purchases.</p>
              </div>
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold">
                    <tr>
                      <th className="px-6 py-5">Order ID</th>
                      <th className="px-6 py-5">Customer Profile</th>
                      <th className="px-6 py-5">Timestamp</th>
                      <th className="px-6 py-5 text-right">Transaction Total</th>
                      <th className="px-6 py-5">Current Phase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(o => (
                      <tr key={o.id} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-mono font-bold text-brand-700">#{o.id}</td>
                        <td className="px-6 py-5 font-medium text-slate-800">{o.userName}</td>
                        <td className="px-6 py-5 text-slate-400">{new Date(o.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-5 text-right font-bold text-slate-900">${o.total.toFixed(2)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${o.status === 'Pending' ? 'bg-amber-400' : 'bg-green-500'}`} />
                            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-600">{o.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          )}

           {activeTab === 'users' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">Customer Base</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Directory of registered project leads and admins.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold">
                      <tr>
                        <th className="px-6 py-5">User Name</th>
                        <th className="px-6 py-5">Email Credential</th>
                        <th className="px-6 py-5">Security Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="text-sm hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                {u.name.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-800">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-slate-600">{u.email}</td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.isAdmin ? 'bg-brand-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {u.isAdmin ? 'Internal Admin' : 'Project Lead'}
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

      {/* Product Edit/Add Modal */}
      {(editingProduct || isAddingNew) && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="md:w-5/12 bg-slate-50 p-8 border-r border-slate-100 flex flex-col items-center justify-center">
               <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-6 text-center w-full">Asset Preview</p>
               <div className="w-full aspect-square rounded-2xl bg-white shadow-inner border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <Package size={48} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400">No Image Selected</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-brand-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-brand-50 transition-colors"
                    >
                      <Upload size={14} /> Local File
                    </button>
                    <p className="text-[10px] text-white font-bold uppercase opacity-60">or paste URL below</p>
                  </div>
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*" 
                 onChange={handleImageUpload} 
               />
               <p className="mt-6 text-[10px] text-slate-400 text-center leading-relaxed italic px-4">
                 Upload high-resolution assets from your computer or Drive. Supported formats: PNG, JPG, WEBP.
               </p>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif font-bold text-slate-800">{editingProduct ? 'Update Asset' : 'New Collection Entry'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={saveProduct} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product Identity</label>
                  <input name="name" defaultValue={editingProduct?.name} placeholder="e.g. Carrara Classic Tile" className="w-full border-slate-200 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                    <select name="category" defaultValue={editingProduct?.category} className="w-full border-slate-200 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm appearance-none bg-white">
                      <option value={ProductCategory.CABINETS}>Cabinets</option>
                      <option value={ProductCategory.FLOORING}>Flooring</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Measurement Unit</label>
                    <input name="unit" defaultValue={editingProduct?.unit} placeholder="e.g. sq ft" className="w-full border-slate-200 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">MSRP ($)</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="0.00" className="w-full border-slate-200 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm font-bold" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Inventory</label>
                    <input name="stock" type="number" defaultValue={editingProduct?.stock} placeholder="0" className="w-full border-slate-200 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm font-bold" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">External Asset URL (Optional)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><LinkIcon size={14} /></div>
                    <input 
                      name="image_url" 
                      placeholder="https://..." 
                      className="w-full border-slate-200 border pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-[11px]" 
                      onChange={(e) => !imagePreview && setImagePreview(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
                  <textarea name="description" defaultValue={editingProduct?.description} placeholder="Key features, durability, finish details..." className="w-full border-slate-200 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm h-28 resize-none" required />
                </div>

                <button type="submit" className="w-full bg-brand-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-brand-900/20 mt-4">
                  {editingProduct ? 'Confirm Updates' : 'Publish to Storefront'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onAuthSuccess: (user: User) => void }> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email === 'admin@oakandstone.com') {
      onAuthSuccess({ ...MOCK_USERS[1], isAdmin: true });
    } else {
      onAuthSuccess({
        id: `u-${Date.now()}`,
        name: formData.name || 'Guest User',
        email: formData.email,
        phone: formData.phone || '000-000-0000',
        address: formData.address || '100 Main St, City, ST',
        isAdmin: false
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-slate-900">{isSignUp ? 'New Project' : 'Welcome'}</h2>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full border-slate-100 bg-slate-50 border p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            )}
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full border-slate-100 bg-slate-50 border p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
            {isSignUp && (
               <input 
               type="text" 
               placeholder="Mailing/Shipping Address" 
               className="w-full border-slate-100 bg-slate-50 border p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
               value={formData.address}
               onChange={e => setFormData({...formData, address: e.target.value})}
               required
             />
            )}
            <input 
              type="password" 
              placeholder="Security Password" 
              className="w-full border-slate-100 bg-slate-50 border p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              required
            />
            <button type="submit" className="w-full bg-brand-700 text-white py-4 rounded-2xl font-bold hover:bg-brand-900 transition-all shadow-xl shadow-brand-700/20 mt-2">
              {isSignUp ? 'Create Project Account' : 'Authenticate Securely'}
            </button>
          </form>
          <div className="mt-8 text-center text-sm text-slate-400">
            {isSignUp ? "Already a regular?" : "Starting a new project?"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 font-bold text-brand-700 hover:underline">
              {isSignUp ? "Sign In" : "Register Now"}
            </button>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-center gap-3 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={16} /> Enterprise Grade Privacy
          </div>
        </div>
      </div>
    </div>
  );
};

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
      setAdvice("I'm sorry, our design engine is busy. Please try again in a few moments.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-8 md:right-8">
      {isOpen ? (
        <div className="bg-white rounded-3xl shadow-2xl w-80 sm:w-96 border border-slate-100 overflow-hidden animate-fade-in flex flex-col max-h-[550px]">
          <div className="p-5 bg-brand-900 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-bold text-sm uppercase tracking-widest">AI Design Consultant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-all opacity-60 hover:opacity-100"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 min-h-[250px] scroll-smooth">
            {advice ? (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-[13px] text-slate-700 leading-relaxed animate-fade-in border-l-4 border-l-brand-700">
                {advice}
              </div>
            ) : (
              <div className="text-center mt-12 px-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-brand-700 border border-slate-100">
                   <HelpCircle size={28} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">How can I assist your design?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Which cabinets pair best with Hickory flooring?" <br/>or<br/> "Recommend a modern kitchen palette."
                </p>
              </div>
            )}
            {isLoading && (
              <div className="flex flex-col items-center justify-center mt-10 gap-3">
                <Loader2 className="animate-spin text-brand-700" size={32} />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generating Proposal...</p>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-5 border-t border-slate-100 flex gap-2 bg-white">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask our expert..."
              className="flex-1 text-sm bg-slate-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-brand-900 text-white p-3.5 rounded-2xl hover:bg-black transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-brand-900/10"
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-900 text-white px-8 py-5 rounded-full shadow-2xl hover:bg-black transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-4 group border-2 border-white/10"
        >
          <div className="relative">
            <HelpCircle size={26} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full border-2 border-brand-900" />
          </div>
          <span className="font-bold text-sm uppercase tracking-[0.2em]">Consult AI</span>
        </button>
      )}
    </div>
  );
};

// --- Main App Entry ---

export default function App() {
  const [view, setView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useStorage<Product[]>('oak_stone_products', INITIAL_PRODUCTS);
  const [orders, setOrders] = useStorage<Order[]>('oak_stone_orders', MOCK_ORDERS);
  const [users, setUsers] = useStorage<User[]>('oak_stone_users', MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
        const p = products.find(prod => prod.id === id);
        const max = p?.stock || 0;
        const newQty = Math.max(0, Math.min(max, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const finalizeCheckout = () => {
    if (!currentUser) return setIsAuthOpen(true);
    
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      items: [...cart],
      total: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      timestamp: new Date().toISOString(),
      status: 'Pending'
    };
    
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(ci => ci.id === p.id);
      if (cartItem) {
        const newStock = Math.max(0, p.stock - cartItem.quantity);
        return { ...p, stock: newStock, inStock: newStock > 0 };
      }
      return p;
    });

    setOrders(prev => [...prev, newOrder]);
    setProducts(updatedProducts);
    setOrderComplete(true);
  };

  const filteredProducts = useMemo(() => {
    return activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  if (view === 'admin') {
    return (
      <AdminDashboard 
        products={products} 
        orders={orders} 
        users={users} 
        onUpdateProducts={setProducts} 
        onExit={() => setView('store')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-x-hidden">
      <Header 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onLogin={() => setIsAuthOpen(true)}
        onAdminClick={() => setView('admin')}
      />
      
      {/* Hero */}
      <div className="relative bg-brand-900 overflow-hidden h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1556912177-c54857056a41?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-30 scale-105" alt="Kitchen background" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/60 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl animate-fade-in">
            <span className="text-brand-500 font-bold uppercase tracking-[0.4em] text-xs">Legacy Interiors</span>
            <h1 className="mt-4 text-6xl md:text-8xl font-serif font-bold text-white leading-[1.1]">Where Stone <br/>Meets Spirit.</h1>
            <p className="mt-8 text-xl text-brand-100/70 leading-relaxed font-light">
              Architectural cabinetry and master-crafted flooring solutions. 
              Enterprise quality for your private sanctuary.
            </p>
            <div className="mt-12 flex flex-wrap gap-5">
               <button onClick={() => document.getElementById('catalog')?.scrollIntoView({behavior: 'smooth'})} className="bg-brand-700 text-white px-10 py-5 rounded-2xl font-bold hover:bg-brand-900 flex items-center gap-3 group transition-all shadow-2xl shadow-brand-900/40">
                 Begin Selection <ArrowRight className="group-hover:translate-x-1 transition-transform" />
               </button>
               <button onClick={() => setIsAuthOpen(true)} className="px-10 py-5 rounded-2xl font-bold border-2 border-white/20 text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                 Register Project
               </button>
            </div>
          </div>
        </div>
      </div>
      
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-px bg-brand-500" />
              <span className="text-brand-700 text-[10px] font-bold uppercase tracking-[0.3em]">Master Catalog</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-slate-900">Premium Materials</h2>
          </div>
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-w-[320px]">
            <Search size={20} className="text-slate-300" />
            <input type="text" placeholder="Search collections..." className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-300" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map(product => (
            <div key={product.id} className="group relative bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 flex flex-col h-full hover:-translate-y-2">
              <div className="aspect-[1.1] w-full overflow-hidden bg-slate-50 relative">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px] flex items-center justify-center">
                    <span className="bg-red-600 text-white text-[10px] font-bold px-5 py-2.5 rounded-full tracking-[0.2em] uppercase shadow-xl">Waitlisted</span>
                  </div>
                )}
                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute top-6 left-6">
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
                       <AlertCircle size={12} /> Scarcity: Only {product.stock}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-10 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] text-brand-700 uppercase tracking-[0.2em] font-bold">{product.category}</span>
                  <p className="text-xl font-bold text-slate-900 tracking-tight">${product.price.toFixed(2)} <span className="text-[10px] text-slate-400 font-medium tracking-normal">/ {product.unit}</span></p>
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-3 group-hover:text-brand-700 transition-colors">{product.name}</h3>
                <p className="text-sm text-slate-400 font-light line-clamp-2 mb-8 leading-relaxed">{product.description}</p>
                
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                  className={`mt-auto w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-[13px] font-bold transition-all shadow-lg ${
                    product.inStock 
                      ? 'bg-slate-900 text-white hover:bg-brand-700 shadow-slate-900/10' 
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  {product.inStock ? <><Plus size={18} /> Request for Project</> : 'Awaiting Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Promise Section */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-slate-100 pt-24">
            <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-700 mb-8 shadow-inner group-hover:scale-110 transition-transform"><Truck size={36} /></div>
                <h4 className="text-xl font-serif font-bold text-slate-900 mb-3">Site Distribution</h4>
                <p className="text-[13px] text-slate-400 leading-relaxed max-w-[240px]">White-glove logistic handling for enterprise-grade materials.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-700 mb-8 shadow-inner group-hover:scale-110 transition-transform"><ShieldCheck size={36} /></div>
                <h4 className="text-xl font-serif font-bold text-slate-900 mb-3">Lifetime Surety</h4>
                <p className="text-[13px] text-slate-400 leading-relaxed max-w-[240px]">Extended coverage protecting your investment across generations.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-700 mb-8 shadow-inner group-hover:scale-110 transition-transform"><Lock size={36} /></div>
                <h4 className="text-xl font-serif font-bold text-slate-900 mb-3">Project Privacy</h4>
                <p className="text-[13px] text-slate-400 leading-relaxed max-w-[240px]">Encrypted procurement and secure asset management.</p>
            </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={(user) => { 
          setCurrentUser(user); 
          setUsers(prev => prev.some(u => u.email === user.email) ? prev : [...prev, user]);
          setIsAuthOpen(false); 
        }} 
      />

      {/* Cart Drawer */}
      <div className={`fixed inset-0 bg-slate-900/70 z-50 transition-all duration-500 backdrop-blur-sm ${isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsCartOpen(false)} />
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-700 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
           <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">Project List</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Materials Staging</p>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="text-slate-300 hover:text-slate-600 hover:rotate-90 transition-all p-2"><X size={32} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-200">
                <ShoppingCart size={100} strokeWidth={0.5} className="mb-6 opacity-20" />
                <p className="text-lg font-serif italic text-slate-300">Staging area empty...</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-8 group">
                  <div className="w-28 h-28 flex-shrink-0 bg-slate-50 rounded-3xl overflow-hidden shadow-inner border border-slate-100">
                    <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-serif font-bold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">${item.price.toFixed(2)} / {item.unit}</p>
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center border border-slate-100 rounded-xl bg-slate-50 px-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-brand-700 transition-colors font-bold text-slate-400">-</button>
                        <span className="w-10 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:text-brand-700 transition-colors font-bold text-slate-400">+</button>
                      </div>
                      <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-[10px] font-bold text-slate-300 hover:text-red-500 uppercase tracking-widest">Remove</button>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 text-lg tracking-tighter">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-10 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between text-2xl font-serif font-bold text-slate-900 mb-8">
              <p>Project Total</p>
              <p className="tracking-tighter">${cartTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                if (!currentUser) return setIsAuthOpen(true);
                setIsCartOpen(false); 
                setIsCheckoutOpen(true);
              }}
              disabled={cart.length === 0}
              className="w-full bg-brand-900 text-white py-6 rounded-2xl font-bold shadow-2xl shadow-brand-900/30 hover:bg-black disabled:opacity-30 transition-all flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em]"
            >
              {currentUser ? 'Initialize Procurement' : 'Authenticate to Order'} <Lock size={18} />
            </button>
            <p className="mt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Professional Site Staging Included</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <div className={`fixed inset-0 bg-brand-900/50 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-all duration-700 ${orderComplete ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="bg-white p-16 rounded-[3rem] shadow-2xl text-center max-w-lg w-full scale-in-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Check className="text-green-600 w-12 h-12" strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Confirmed</h2>
          <p className="text-slate-400 mb-12 leading-relaxed text-sm">Your assets have been allocated and delivery is being prioritized for your project location.</p>
          <button onClick={() => { setCart([]); setOrderComplete(false); }} className="w-full bg-brand-900 text-white py-5 rounded-2xl font-bold hover:bg-black shadow-2xl shadow-brand-900/20 transition-all">
            Return to Storefront
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-12 relative">
             <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors p-2"><X size={28} /></button>
             <h2 className="text-3xl font-serif font-bold text-slate-900 mb-3">Procurement</h2>
             <p className="text-slate-400 mb-10 text-xs uppercase tracking-[0.2em] font-bold italic">Secure Project Checkout: {currentUser?.name}</p>
             
             <div className="space-y-8">
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-700 shadow-sm"><Truck size={24} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Staging Address</p>
                    <p className="text-sm font-bold text-slate-800">{currentUser?.address}</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                 <p className="text-xs text-slate-400 uppercase tracking-widest font-bold ml-1">Proposed Delivery Window</p>
                 <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {DELIVERY_SLOTS.filter(s => s.available).slice(0, 4).map(slot => (
                      <button key={slot.id} className="flex-shrink-0 border-2 border-slate-100 p-5 rounded-2xl text-center hover:border-brand-700 transition-all focus:border-brand-700 focus:bg-brand-50 group min-w-[120px]">
                        <p className="text-[10px] font-bold text-slate-300 group-hover:text-brand-500 mb-1">{slot.date}</p>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Early AM</p>
                      </button>
                    ))}
                 </div>
               </div>

               <div className="pt-10 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Aggregate Total</span>
                      <span className="text-3xl font-serif font-bold text-slate-900 tracking-tighter">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => { finalizeCheckout(); setIsCheckoutOpen(false); }} className="w-full bg-brand-700 text-white py-5 rounded-[1.5rem] font-bold hover:bg-brand-900 flex items-center justify-center gap-3 shadow-2xl shadow-brand-700/30 transition-all uppercase tracking-[0.2em] text-sm">
                    Authorize Procurement <Check size={20} />
                  </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Global CSS for animations and layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .scale-in-center { animation: scale-in-center 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        @keyframes scale-in-center { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        body { -webkit-tap-highlight-color: transparent; }
      `}} />

      <DesignAssistant />
    </div>
  );
}
