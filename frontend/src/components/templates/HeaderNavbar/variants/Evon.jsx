import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, Settings, Heart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useTemplates } from '@/contexts/TemplateContext';

export default function HeaderNavbarEvon({
  menu,
  user,
  logout,
  cartCount,
  setOpenCart,
  q,
  setQ,
  onSearch,
  mobileSearch,
  setMobileSearch,
  navigate
}) {
  const links = menu.header_links || [];
  const location = useLocation();
  const { templates } = useTemplates() || {};

  // Spaced site name: "E V O N" -> "E V O N"
  const siteName = (menu.site_name || 'EVON').toUpperCase().split('').join(' ');

  const borderRadius = templates?.HeaderNavbar_evonBorderRadius ?? 999;

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4" data-testid="site-header-evon">
        <header 
          className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full max-w-7xl px-5 py-2.5 flex items-center justify-between"
          style={{ borderRadius: `${borderRadius}px` }}
        >
          
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 rounded-full text-gray-700 hover:bg-gray-100"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-white">
                <SheetHeader><SheetTitle className="text-left">Menü</SheetTitle></SheetHeader>
                <nav className="mt-4 flex flex-col gap-1">
                  <Link to="/" className={`px-3 py-2 rounded-xl text-sm font-medium ${location.pathname === '/' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Ana Sayfa</Link>
                  {links.map(c => (
                    <Link key={c.url} to={c.url} className={`px-3 py-2 rounded-xl text-sm font-medium ${location.pathname.startsWith(c.url) ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-700'}`}>{c.label}</Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* LEFT: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            <Link to="/" className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${location.pathname === '/' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              Ana Sayfa
            </Link>
            {links.slice(0, 5).map((c, idx) => {
              const isActive = location.pathname.startsWith(c.url);
              const isSecondary = !isActive && idx === 0 && location.pathname === '/'; 
              return (
                <Link key={c.url} to={c.url} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${isActive ? 'bg-[#1A1A1A] text-white' : (isSecondary ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}`}>
                  {c.label}
                </Link>
              );
            })}
          </nav>

          {/* CENTER: Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center justify-center mx-4">
            <span className="text-[17px] font-medium tracking-[0.25em] text-[#1A1A1A]">{siteName}</span>
          </Link>

          {/* RIGHT: Actions */}
          <div className="flex items-center justify-end gap-1 flex-1">
            
            {/* Currency (Visual Only) */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-[11px] font-semibold text-gray-600 border border-gray-100 mr-2 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm leading-none">🇹🇷</span>
              <span>₺TRY </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            <form onSubmit={onSearch} className="hidden xl:block relative w-44 mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Arama yap..." className="pl-9 h-9 rounded-full bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 text-xs shadow-none" />
            </form>

            <Button variant="ghost" size="icon" className="xl:hidden rounded-full hover:bg-gray-100 text-gray-700 h-9 w-9" onClick={() => setMobileSearch(!mobileSearch)}>
              <Search className="h-4 w-4" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-700 h-9 w-9"><User className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white w-56 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-gray-100 p-2 mt-2">
                  <div className="px-2 py-1.5 text-sm"><div className="font-medium text-gray-900">{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></div>
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate('/hesap')}><User className="mr-2 h-4 w-4 text-gray-500" />Hesabım</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate('/hesap/favorilerim')}><Heart className="mr-2 h-4 w-4 text-gray-500" />Favorilerim</DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate('/admin')}><Settings className="mr-2 h-4 w-4 text-gray-500" />Yönetim Paneli</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Çıkış</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/giris"><Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-700 h-9 w-9"><User className="h-4 w-4" /></Button></Link>
            )}

            <Button variant="ghost" size="icon" onClick={(e) => { e.currentTarget.blur(); setOpenCart(true); }} className="relative rounded-full hover:bg-gray-100 text-gray-700 h-9 w-9 ml-1">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-[#1A1A1A] text-white border-0 rounded-full text-[9px] flex items-center justify-center font-bold">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </header>

        {/* Mobile Search Dropdown */}
        {mobileSearch && (
          <div className="absolute top-20 left-4 right-4 xl:hidden z-40">
            <form onSubmit={onSearch} className="bg-white p-3 rounded-2xl shadow-xl flex gap-2 border border-gray-100">
              <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Ara..." className="flex-1 rounded-xl h-10 bg-gray-50 border-transparent text-sm" />
              <Button type="button" variant="ghost" className="rounded-xl h-10 text-sm" onClick={() => setMobileSearch(false)}>İptal</Button>
            </form>
          </div>
        )}
      </div>
      
      {/* Spacer to prevent content from going behind the fixed header */}
      <div className="h-24"></div>
    </>
  );
}
