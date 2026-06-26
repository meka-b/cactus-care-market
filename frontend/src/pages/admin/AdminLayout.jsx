import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Leaf, LayoutDashboard, Package, ShoppingCart, Wand2, LogOut, Home, Star, Ticket, BookOpen, Cog, Layers, Palette, Menu, X, Bell, Brain, Users, Settings, Gift, Network, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState(null);

  // Mobil menü açıksa ve sayfa değişirse menüyü kapat
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) return <div className="p-10 flex justify-center text-muted-foreground">Yükleniyor...</div>;
  if (!user) { navigate('/giris'); return null; }
  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto p-10 text-center">
        <Card className="p-6">
          <p className="mb-4 text-destructive font-medium">Bu sayfaya erişim yetkiniz yok.</p>
          <Link to="/"><Button>Ana Sayfa</Button></Link>
        </Card>
      </div>
    );
  }

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const NavLinks = () => (
    <>
      <NavLink to="/admin" end className={linkCls}><LayoutDashboard className="w-5 h-5" />Dashboard</NavLink>
      <NavLink to="/admin/urun-ekle" className={linkCls}><Wand2 className="w-5 h-5" />AI Ürün Ekle</NavLink>
      <NavLink to="/admin/urunler" className={linkCls}><Package className="w-5 h-5" />Ürünler</NavLink>
      <NavLink to="/admin/siparisler" className={linkCls}><ShoppingCart className="w-5 h-5" />Siparişler</NavLink>
      <NavLink to="/admin/yorumlar" className={linkCls}><Star className="w-5 h-5" />Yorumlar</NavLink>
      <NavLink to="/admin/kuponlar" className={linkCls}><Ticket className="w-5 h-5" />Kuponlar</NavLink>
      <NavLink to="/admin/kampanyalar" className={linkCls}><Layers className="w-5 h-5" />Kampanyalar</NavLink>
      <NavLink to="/admin/blog" className={linkCls}><BookOpen className="w-5 h-5" />Blog</NavLink>
      <NavLink to="/admin/knowledge-graph" className={linkCls}><Network className="w-5 h-5" />Knowledge Graph</NavLink>
      <NavLink to="/admin/rag" className={linkCls}><Brain className="w-5 h-5" />Yapay Zeka (RAG)</NavLink>
      <NavLink to="/admin/tasarim" className={linkCls}><Palette className="w-5 h-5" />Tasarım Yönetimi</NavLink>
      <NavLink to="/admin/hero" className={linkCls}><Wand2 className="w-5 h-5" />Hero Yönetimi</NavLink>
      <NavLink to="/admin/kategoriler" className={linkCls}><Layers className="w-5 h-5" />Kategoriler</NavLink>
      <NavLink to="/admin/doktor" className={linkCls}><Activity className="w-5 h-5" />Sistem Doktoru</NavLink>
      <NavLink to="/admin/ayarlar" className={linkCls}><Cog className="w-5 h-5" />Ayarlar</NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex" data-testid="admin-shell">
      <Toaster position="top-center" richColors />
      
      {/* 1. Panel: Sol Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-[260px] bg-white border-r border-slate-200 flex-col p-5 sticky top-0 h-screen shrink-0 z-20">
        <Link to="/admin" className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-[12px] bg-emerald-500 text-white grid place-items-center shadow-sm">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold font-heading text-base leading-tight">Yeşil Dükkan</div>
            <div className="text-xs font-medium text-emerald-600">Yönetim Paneli</div>
          </div>
        </Link>
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar">
          <NavLinks />
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
          <Link to="/"><Button variant="outline" className="w-full justify-start text-slate-600 border-slate-200" size="sm"><Home className="w-4 h-4 mr-2" />Mağazaya Dön</Button></Link>
          <Button onClick={logout} variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" size="sm"><LogOut className="w-4 h-4 mr-2" />Güvenli Çıkış</Button>
        </div>
      </aside>

      {/* Mobil Header & Hamburger Menü */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white grid place-items-center"><Leaf className="w-5 h-5" /></div>
          <span className="font-bold font-heading">Admin</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-50 lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl z-50 flex flex-col p-5 lg:hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-emerald-500 text-white grid place-items-center"><Leaf className="w-6 h-6" /></div>
                  <div className="font-bold font-heading text-base">Menü</div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                <NavLinks />
              </nav>
              <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                <Link to="/"><Button variant="outline" className="w-full justify-start"><Home className="w-4 h-4 mr-2" />Mağazaya Dön</Button></Link>
                <Button onClick={logout} variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4 mr-2" />Çıkış</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ana İçerik Wrapper (Orta + Sağ Panel) */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        
        {/* Yüzen (Floating) Sticky Header */}
        <div className="px-4 md:px-8 pt-4 md:pt-6 sticky top-0 z-30 lg:z-10">
          <header className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-sm px-6 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 hidden sm:block">Hoş Geldiniz, {user.name}</h2>
            <div className="flex items-center gap-4 ml-auto">
              <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-sm">
                  <p className="font-medium text-slate-700 leading-none">{user.name}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-none">{user.email}</p>
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* İçerik Row: 2. Panel (Orta) + 3. Panel (Sağ) */}
        <div className="flex-1 flex px-4 md:px-8 py-6 gap-6">
          
          {/* 2. Panel: Orta İçerik Alanı */}
          <main className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1">
              <Outlet context={{ setRightPanel }} />
            </div>
            
            {/* Sadece Orta Alanda Bulunan Footer */}
            <footer className="mt-12 pt-6 pb-2 border-t border-slate-200/50 text-center text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} Yeşil Dükkan Admin Panel v2.0. Tüm hakları saklıdır.</p>
            </footer>
          </main>

          {/* 3. Panel: Dinamik Sağ Sidebar (Sadece Masaüstü) */}
          {rightPanel && (
            <aside className="hidden xl:block w-[300px] shrink-0">
              <div className="sticky top-[104px] space-y-6">
                {rightPanel}
              </div>
            </aside>
          )}
        </div>

        {/* Mobil Sağ Panel Gösterimi (Sayfanın en altında belirir) */}
        <div className="xl:hidden px-4 md:px-8 pb-10">
           {rightPanel && (
             <div className="mt-8 space-y-6">
               <div className="flex items-center gap-2 mb-4">
                 <div className="h-px flex-1 bg-slate-200"></div>
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sayfa Özeti / Aksiyonlar</span>
                 <div className="h-px flex-1 bg-slate-200"></div>
               </div>
               {rightPanel}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
