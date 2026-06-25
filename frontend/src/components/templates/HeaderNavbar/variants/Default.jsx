import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, LogOut, Settings, Leaf, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function HeaderNavbarDefault({
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[hsl(var(--border))]" data-testid="site-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2" data-testid="header-mobile-menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white">
              <SheetHeader><SheetTitle className="text-left">Menü</SheetTitle></SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                <Link to="/" className="px-3 py-2 rounded-xl hover:bg-[hsl(var(--accent))] text-foreground">Ana Sayfa</Link>
                {links.map(c => (
                  <Link key={c.url} to={c.url} className="px-3 py-2 rounded-xl hover:bg-[hsl(var(--accent))] text-foreground">{c.label}</Link>
                ))}
                <Link to="/hesap/favorilerim" className="px-3 py-2 rounded-xl hover:bg-[hsl(var(--accent))] text-foreground">Favorilerim</Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2" data-testid="header-logo">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white grid place-items-center">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-base sm:text-lg font-semibold font-heading hidden sm:block">{menu.site_name || 'Yeşil Dükkan'}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {links.slice(0, 6).map(c => (
              <Link key={c.url} to={c.url} className="px-3 py-2 text-sm rounded-xl hover:bg-[hsl(var(--accent))] text-foreground">{c.label}</Link>
            ))}
          </nav>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md ml-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input data-testid="header-search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Bitki ara..." className="pl-9 h-10" />
            </div>
          </form>

          <div className="ml-auto md:ml-0 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSearch(true)} data-testid="header-mobile-search-button"><Search className="h-5 w-5" /></Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="header-account-button"><User className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white w-56">
                  <div className="px-2 py-1.5 text-sm"><div className="font-medium">{user.name}</div><div className="text-xs text-muted-foreground">{user.email}</div></div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/hesap')} data-testid="header-account-link"><User className="mr-2 h-4 w-4" />Hesabım</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/hesap/favorilerim')} data-testid="header-wishlist-link"><Heart className="mr-2 h-4 w-4" />Favorilerim</DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="header-admin-link"><Settings className="mr-2 h-4 w-4" />Yönetim Paneli</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="header-logout-button"><LogOut className="mr-2 h-4 w-4" />Çıkış</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/giris"><Button variant="ghost" size="icon" data-testid="header-login-button"><User className="h-5 w-5" /></Button></Link>
            )}

            <Button variant="ghost" size="icon" onClick={() => setOpenCart(true)} className="relative" data-testid="header-cart-button">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-white border-0 rounded-full" data-testid="header-cart-count">{cartCount}</Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {mobileSearch && (
        <div className="md:hidden border-t border-[hsl(var(--border))] bg-white p-3 shadow-sm absolute top-full left-0 right-0">
          <form onSubmit={onSearch} className="flex gap-2">
            <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Bitki ara..." className="flex-1" />
            <Button type="button" variant="ghost" onClick={() => setMobileSearch(false)}>İptal</Button>
          </form>
        </div>
      )}
    </header>
  );
}
