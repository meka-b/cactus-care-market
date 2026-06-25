import React, { createContext, useContext, useEffect, useState } from 'react';

const CartCtx = createContext(null);

/**
 * Cart state:
 *  - items:   Array<{ product_id, name, slug, price, quantity, image, campaign_id? }>
 *  - bundles: Array<{
 *      bundle_id (uuid local), campaign_id, name, type, badge_text,
 *      items: [{product_id, name, slug, price, quantity, image}],
 *      subtotal, discount, bundle_total, breakdown
 *    }>
 *
 * subtotal hesabı:
 *   - items normal toplam
 *   - bundles içindeki item'ların toplam normal fiyatı items içindedir (her bundle item ayrıca items içine eklenir)
 *   - bundle_discount = bundles toplamının indirim kalemi
 */
const CartCtx_ = CartCtx; // alias

const uuid = () => (crypto && crypto.randomUUID ? crypto.randomUUID() : 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('yd_cart') || '[]'); } catch { return []; }
  });
  const [bundles, setBundles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('yd_bundles') || '[]'); } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => { localStorage.setItem('yd_cart', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('yd_bundles', JSON.stringify(bundles)); }, [bundles]);

  const add = (product, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.product_id === product.id && !p.campaign_id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [...prev, {
        product_id: product.id,
        name: product.common_name_tr,
        slug: product.slug,
        price: product.price,
        quantity: qty,
        image: product.images?.[0]?.thumb || product.images?.[0]?.main || '',
      }];
    });
    setOpen(true);
  };

  const remove = (productId) => setItems(prev => prev.filter(p => p.product_id !== productId));

  const setQty = (productId, qty) => {
    if (qty <= 0) return remove(productId);
    setItems(prev => prev.map(p => p.product_id === productId ? { ...p, quantity: qty } : p));
  };

  /**
   * addBundle: Kampanyalı bundle'ı sepete ekler.
   * bundlePayload = {
   *   campaign_id, name, type, badge_text, items:[{product_id,name,slug,price,quantity,image}],
   *   subtotal, discount, bundle_total, breakdown
   * }
   * - Her item normal items array'ine de campaign_id ile eklenir (görsel düzen için)
   * - bundles array'ine bundle özet eklenir
   */
  const addBundle = (bundlePayload) => {
    const bundle_id = uuid();
    const bundle = { ...bundlePayload, bundle_id };
    setBundles(prev => [...prev, bundle]);
    setItems(prev => {
      const copy = [...prev];
      for (const bi of bundle.items) {
        copy.push({
          product_id: bi.product_id,
          name: bi.name,
          slug: bi.slug,
          price: bi.price,
          quantity: bi.quantity || 1,
          image: bi.image,
          campaign_id: bundle.campaign_id,
          bundle_id,
        });
      }
      return copy;
    });
    setOpen(true);
  };

  const removeBundle = (bundle_id) => {
    setBundles(prev => prev.filter(b => b.bundle_id !== bundle_id));
    setItems(prev => prev.filter(p => p.bundle_id !== bundle_id));
  };

  const clear = () => { setItems([]); setBundles([]); };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const bundleDiscount = bundles.reduce((s, b) => s + (b.discount || 0), 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const hasBundles = bundles.length > 0;

  return (
    <CartCtx.Provider value={{
      items, bundles, count, subtotal, bundleDiscount, hasBundles,
      add, remove, setQty, clear, addBundle, removeBundle,
      open, setOpen,
    }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() { return useContext(CartCtx); }
