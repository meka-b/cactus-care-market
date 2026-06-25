import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { BottomNav } from './BottomNav';
import { YaverChat } from './YaverChat';
import { Toaster } from '@/components/ui/sonner';

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white max-w-full overflow-x-clip">
      <Header />
      <main className="flex-1 pb-16 md:pb-0 min-w-0">{children}</main>
      <Footer />
      <CartDrawer />
      <BottomNav />
      <YaverChat />
      <Toaster position="top-center" richColors />
    </div>
  );
}
