import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, ShoppingBag, Layers, X } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { resolveImageUrl } from '@/lib/api';

export function CartDrawer() {
  const { items, bundles, subtotal, bundleDiscount, setQty, remove, removeBundle, open, setOpen } = useCart();
  const navigate = useNavigate();
  const goCheckout = () => { setOpen(false); navigate('/odeme'); };

  // Bundle items are grouped via bundle_id, plain items have no bundle_id
  const bundleMap = Object.fromEntries(bundles.map(b => [b.bundle_id, b]));
  const plainItems = items.filter(i => !i.bundle_id);

  const total = Math.max(0, subtotal - bundleDiscount);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-white" data-testid="cart-drawer">
        <div className="max-w-2xl mx-auto w-full">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-heading flex items-center gap-2"><ShoppingBag className="w-5 h-5" />Sepetim ({items.length})</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground" data-testid="cart-empty">Sepetiniz boş.</div>
            ) : (
              <div className="space-y-3">
                {/* Bundles */}
                {bundles.map(b => (
                  <div key={b.bundle_id} className="border-2 border-primary/30 rounded-xl p-3 bg-[hsl(var(--accent))]/40" data-testid={`cart-bundle-${b.bundle_id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">{b.name}</div>
                        <Badge className="bg-primary text-white border-0 text-[10px] mt-0.5">{b.badge_text || 'Bundle'}</Badge>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeBundle(b.bundle_id)} data-testid={`cart-bundle-remove-${b.bundle_id}`}><X className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                      {items.filter(i => i.bundle_id === b.bundle_id).map(it => (
                        <div key={`${b.bundle_id}-${it.product_id}`} className="flex items-center gap-2 text-sm" data-testid={`cart-bundle-item-${it.product_id}`}>
                          {it.image && <img src={resolveImageUrl(it.image)} alt={it.name} className="w-10 h-12 object-cover rounded-xl" />}
                          <div className="flex-1 line-clamp-1">{it.name}</div>
                          <div className="font-medium">₺{(it.price * it.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-primary/20 text-sm">
                      <span className="text-muted-foreground">Bundle indirimi</span>
                      <span className="text-primary font-semibold" data-testid={`cart-bundle-discount-${b.bundle_id}`}>-₺{(b.discount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {/* Plain items */}
                {plainItems.map(it => (
                  <div key={it.product_id} className="flex items-center gap-3 bg-[#F7FBF8] rounded-xl p-3 border border-[hsl(var(--border))]" data-testid={`cart-item-${it.product_id}`}>
                    {it.image && <img src={resolveImageUrl(it.image)} alt={it.name} className="w-16 h-16 object-cover rounded-xl" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-1">{it.name}</div>
                      <div className="text-sm text-primary font-semibold mt-0.5">₺{it.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl" onClick={() => setQty(it.product_id, it.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                      <span className="w-7 text-center text-sm" data-testid={`cart-qty-${it.product_id}`}>{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl" onClick={() => setQty(it.product_id, it.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => remove(it.product_id)} data-testid={`cart-remove-${it.product_id}`}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DrawerFooter>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span data-testid="cart-subtotal">₺{subtotal.toFixed(2)}</span>
            </div>
            {bundleDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-primary">
                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />Bundle İndirimi</span>
                <span data-testid="cart-bundle-discount-total">-₺{bundleDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
              <span className="text-muted-foreground">Toplam</span>
              <span className="text-2xl font-semibold" data-testid="cart-total">₺{total.toFixed(2)}</span>
            </div>
            <Button onClick={goCheckout} disabled={items.length === 0} className="w-full bg-primary text-white hover:bg-emerald-600 h-11" data-testid="cart-checkout-button">Ödemeye Geç</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
