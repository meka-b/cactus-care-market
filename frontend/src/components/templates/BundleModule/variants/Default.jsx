import React, { useEffect, useMemo, useState } from 'react';
import { api, resolveImageUrl } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/lib/cart';
import { Layers, ShoppingCart, Timer, Plus } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Bundle / Frequently Bought Together module.
 * Renders horizontally-stacked product cards with checkboxes.
 * Supports 5 campaign types:
 *   fixed_bundle, percentage_bundle, fixed_amount_bundle, buy_x_get_y, quantity_break
 * Shows live countdown if end_at is set, hides bundle / disables CTA when any product is out of stock.
 */

function useCountdown(endAtIso) {
  const target = useMemo(() => endAtIso ? new Date(endAtIso).getTime() : null, [endAtIso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = target - now;
  if (diff <= 0) return { expired: true, label: 'Sona erdi' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    expired: false,
    label: days > 0 ? `${days}g ${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(hours)}:${pad(mins)}:${pad(secs)}`,
  };
}

function CampaignTypeBadge({ type, badge_text }) {
  if (badge_text) return <Badge className="bg-primary text-white border-0" data-testid="bundle-badge">{badge_text}</Badge>;
  const labels = {
    fixed_bundle: 'Birlikte Al',
    percentage_bundle: 'Bundle İndirimi',
    fixed_amount_bundle: 'Sepet İndirimi',
    buy_x_get_y: 'X Al Y Ücretsiz',
    quantity_break: 'Miktar İndirimi',
  };
  return <Badge className="bg-primary text-white border-0">{labels[type] || 'Kampanya'}</Badge>;
}

function BundleProductRow({ product, isPrimary, isFree, checked, disabled, onToggle }) {
  if (!product) return null;
  const img = product.image ? resolveImageUrl(product.image) : null;
  return (
    <label
      className={[
        'relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer select-none group',
        checked ? 'bg-[#F7FBF8] border-primary shadow-sm' : 'bg-white border-[hsl(var(--border))]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50',
      ].join(' ')}
      data-testid={`bundle-row-${product.id}`}
    >
      <div className="absolute top-3 right-3 z-10">
        <Checkbox
          checked={checked}
          disabled={disabled || isPrimary}
          onCheckedChange={() => !disabled && onToggle(product.id)}
          className="rounded-full data-[state=checked]:bg-primary"
          data-testid={`bundle-check-${product.id}`}
        />
      </div>
      <div className="w-16 h-20 shrink-0 rounded-xl overflow-hidden bg-[#F7FBF8] border border-[hsl(var(--border))] group-hover:shadow-sm transition-shadow">
        {img ? (
          <img src={img} alt={product.image_alt || product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : <div className="w-full h-full shimmer" />}
      </div>
      <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {isPrimary && <Badge variant="outline" className="text-[9px] py-0 border-primary/30 text-primary uppercase tracking-wider font-semibold">Ana Ürün</Badge>}
          {isFree && <Badge className="text-[9px] py-0 bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider font-semibold">Ücretsiz</Badge>}
          {!product.in_stock && <Badge variant="outline" className="text-[9px] py-0 border-red-300 text-red-600 uppercase tracking-wider font-semibold">Stokta Yok</Badge>}
        </div>
        <div className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors" data-testid={`bundle-product-name-${product.id}`}>{product.name}</div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <div className={`text-sm font-bold ${isFree && checked ? 'text-emerald-600' : 'text-foreground'}`}>
            {isFree && checked ? 'BEDAVA' : `₺${(product.price || 0).toFixed(2)}`}
          </div>
          {isFree && checked && <div className="text-[10px] text-muted-foreground line-through">₺{(product.price || 0).toFixed(2)}</div>}
        </div>
      </div>
    </label>
  );
}

export default function BundleModuleDefault({ productId }) {
  const { addBundle } = useCart();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/campaigns/for-product/${productId}`)
      .then(r => { if (alive) setCampaigns(r.data.items || []); })
      .catch(() => { if (alive) setCampaigns([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [productId]);

  if (loading) {
    return (
      <Card className="p-4 bg-white" data-testid="bundle-module-loading">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (!campaigns.length) return null;

  return (
    <div className="space-y-4" data-testid="bundle-module">
      {campaigns.map(c => <BundleCard key={c.id} campaign={c} onAddBundle={addBundle} />)}
    </div>
  );
}

function BundleCard({ campaign, onAddBundle }) {
  const countdown = useCountdown(campaign.end_at);
  const expired = countdown?.expired === true;

  // All candidate products that the user can toggle.
  const allProducts = useMemo(() => {
    const list = [];
    if (campaign.primary_product) list.push({ p: campaign.primary_product, isPrimary: true, isFree: false });
    for (const r of (campaign.related_products || [])) list.push({ p: r, isPrimary: false, isFree: false });
    if (campaign.free_product && campaign.type === 'buy_x_get_y') {
      list.push({ p: campaign.free_product, isPrimary: false, isFree: true });
    }
    // limit to max 3 for UI density (PRD: max 3)
    return list.slice(0, 3);
  }, [campaign]);

  const [selected, setSelected] = useState(() => {
    const init = {};
    for (const x of allProducts) init[x.p.id] = true; // hepsi seçili gelsin (max 3)
    return init;
  });

  const [busy, setBusy] = useState(false);

  const selectedItems = useMemo(
    () => allProducts.filter(x => selected[x.p.id] && x.p?.in_stock !== false),
    [allProducts, selected]
  );

  // Local calculation (mirrors backend; backend is source of truth at checkout)
  const calc = useMemo(() => {
    const items = selectedItems.map(x => ({ price: x.p.price, qty: 1, ...x }));
    const subtotal = items.reduce((s, i) => s + i.p.price * 1, 0);
    const primarySelected = selectedItems.some(x => x.isPrimary);
    let discount = 0;
    let breakdown = '';
    const t = campaign.type;
    if (t === 'fixed_bundle' && primarySelected && selectedItems.length >= 2) {
      discount = Math.max(0, subtotal - (campaign.bundle_price || 0));
      breakdown = `Birlikte fiyat: ₺${(campaign.bundle_price || 0).toFixed(2)}`;
    } else if (t === 'percentage_bundle' && primarySelected && selectedItems.length >= 2) {
      discount = subtotal * (campaign.discount_pct || 0) / 100;
      breakdown = `%${campaign.discount_pct} bundle indirimi`;
    } else if (t === 'fixed_amount_bundle' && primarySelected && selectedItems.length >= 2) {
      discount = Math.min(campaign.discount_amount || 0, subtotal);
      breakdown = `Birlikte alımda -₺${(campaign.discount_amount || 0).toFixed(2)}`;
    } else if (t === 'buy_x_get_y') {
      const free = selectedItems.find(x => x.isFree);
      if (primarySelected && free) {
        discount = (free.p.price || 0) * (campaign.free_qty || 1);
        breakdown = `${campaign.free_qty || 1} adet ücretsiz`;
      }
    } else if (t === 'quantity_break' && primarySelected) {
      // For quantity break we treat selected primary as qty=1; user adjusts qty after add (MVP simple)
      const tier = (campaign.quantity_tiers || []).slice().sort((a, b) => a.min_qty - b.min_qty).reverse().find(tr => 1 >= tr.min_qty);
      if (tier) {
        discount = (campaign.primary_product?.price || 0) * tier.discount_pct / 100;
        breakdown = `${tier.min_qty}+ adet → %${tier.discount_pct} indirim`;
      } else {
        breakdown = `Birden fazla al, indirimi yakala`;
      }
    }
    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      breakdown,
      ok: discount > 0,
    };
  }, [campaign, selectedItems]);

  const anyOutOfStock = (campaign.any_out_of_stock || false);
  const ctaDisabled = expired || anyOutOfStock || !calc.ok || busy;

  const toggle = (pid) => {
    setSelected(s => ({ ...s, [pid]: !s[pid] }));
  };

  const handleAdd = async () => {
    setBusy(true);
    try {
      // Verify with backend (defense-in-depth)
      const ids = selectedItems.map(x => x.p.id);
      const r = await api.post('/campaigns/calculate', { campaign_id: campaign.id, selected_product_ids: ids });
      if (!r.data?.valid) {
        toast.error(r.data?.reason || 'Kampanya geçerli değil.');
        setBusy(false);
        return;
      }
      // Build bundle payload for cart
      const itemsForCart = selectedItems.map(x => ({
        product_id: x.p.id,
        name: x.p.name,
        slug: x.p.slug,
        price: x.p.price,
        quantity: 1,
        image: x.p.image,
      }));
      onAddBundle({
        campaign_id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        badge_text: campaign.badge_text,
        items: itemsForCart,
        subtotal: r.data.subtotal,
        discount: r.data.discount,
        bundle_total: r.data.bundle_total,
        breakdown: r.data.breakdown,
      });
      toast.success('Bundle sepete eklendi');
    } catch (err) {
      toast.error('Bundle eklenemedi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 bg-white border-primary/20" data-testid={`bundle-card-${campaign.id}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center shrink-0">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold font-heading text-sm sm:text-base line-clamp-1" data-testid="bundle-title">{campaign.name}</div>
            {campaign.description && <div className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</div>}
          </div>
        </div>
        <CampaignTypeBadge type={campaign.type} badge_text={campaign.badge_text} />
      </div>

      {/* Countdown */}
      {campaign.end_at && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">Kampanya bitimi:</span>
          <span className="font-mono font-semibold text-primary" data-testid="bundle-countdown">
            {countdown?.label || '—'}
          </span>
        </div>
      )}

      {/* Stock warning */}
      {anyOutOfStock && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2" data-testid="bundle-stock-warning">
          Bu kampanyadaki bir veya birden fazla ürün şu an stokta yok.
        </div>
      )}

      {/* Products with "+" separators */}
      <div className="space-y-2">
        {allProducts.map((x, i) => (
          <React.Fragment key={x.p.id}>
            <BundleProductRow
              product={x.p}
              isPrimary={x.isPrimary}
              isFree={x.isFree}
              checked={!!selected[x.p.id]}
              disabled={x.p.in_stock === false}
              onToggle={toggle}
            />
            {i < allProducts.length - 1 && (
              <div className="flex justify-center -my-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white border border-[hsl(var(--border))] shadow-sm grid place-items-center">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Normal Toplam</span>
          <span className="line-through text-muted-foreground" data-testid="bundle-subtotal">₺{calc.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-primary">
          <span>Kampanya İndirimi</span>
          <span data-testid="bundle-discount">-₺{calc.discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold pt-1.5 border-t border-[hsl(var(--border))]">
          <span>Birlikte Fiyat</span>
          <span className="text-primary" data-testid="bundle-total">₺{calc.total.toFixed(2)}</span>
        </div>
        {calc.breakdown && (
          <div className="text-[11px] text-muted-foreground">{calc.breakdown}</div>
        )}
      </div>

      <Button
        onClick={handleAdd}
        disabled={ctaDisabled}
        className="w-full mt-4 bg-primary text-white hover:bg-emerald-600 h-11"
        data-testid="bundle-add-button"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {expired ? 'Kampanya Bitti' : (anyOutOfStock ? 'Stokta Yok' : 'Birlikte Al')}
      </Button>
    </Card>
  );
}
