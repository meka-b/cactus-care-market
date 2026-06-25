import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart';

export function BottomNav() {
  const { count, setOpen } = useCart();
  const location = useLocation();
  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  const items = [
    { to: '/', icon: Home, label: 'Ana Sayfa', exact: true },
    { to: '/k/kaktusler', icon: Layers, label: 'Kategoriler' },
    { to: '/hesap/favorilerim', icon: Heart, label: 'Favoriler' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[hsl(var(--border))]" data-testid="bottom-nav">
      <div className="grid grid-cols-4">
        {items.map(it => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.exact}
              className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              data-testid={`bottom-nav-${it.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] text-muted-foreground relative" data-testid="bottom-nav-sepet">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] rounded-full min-w-[16px] h-4 px-1 grid place-items-center">{count}</span>}
          </div>
          <span>Sepet</span>
        </button>
      </div>
    </nav>
  );
}
