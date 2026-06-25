import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './auth';

const WishlistCtx = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const reload = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    try {
      const r = await api.get('/wishlist/ids');
      setIds(new Set(r.data.ids || []));
    } catch {}
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = async (productId) => {
    if (!user) return { needAuth: true };
    const r = await api.post('/wishlist/toggle', { product_id: productId });
    setIds(prev => {
      const next = new Set(prev);
      if (r.data.in_wishlist) next.add(productId); else next.delete(productId);
      return next;
    });
    return r.data;
  };

  const isIn = (productId) => ids.has(productId);

  return (
    <WishlistCtx.Provider value={{ ids, isIn, toggle, reload }}>
      {children}
    </WishlistCtx.Provider>
  );
}

export function useWishlist() { return useContext(WishlistCtx); }
