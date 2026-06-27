import React, { useEffect, useMemo, useState } from 'react';
import { api, resolveImageUrl } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/lib/cart';
import { toast } from 'sonner';

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

function BundleProductRow({ product, isPrimary, isFree, checked, disabled, onToggle }) {
  if (!product) return null;
  const img = product.image ? resolveImageUrl(product.image) : null;
  return (
    <label
      className={[
        'flex items-center gap-4 py-3 cursor-pointer select-none group border-b border-gray-100 last:border-0',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
      data-testid={`bundle-row-${product.id}`}
    >
      <div className="shrink-0 flex items-center">
        <Checkbox
          checked={checked}
          disabled={disabled || isPrimary}
          onCheckedChange={() => !disabled && onToggle(product.id)}
          className="rounded-xl data-[state=checked]:bg-black data-[state=checked]:border-black"
          data-testid={`bundle-check-${product.id}`}
        />
      </div>
      <div className="w-12 h-16 shrink-0 rounded overflow-hidden bg-gray-50 border border-gray-100 transition-opacity group-hover:opacity-90">
        {img ? (
          <img src={img} alt={product.image_alt || product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : <div className="w-full h-full shimmer" />}
      </div>
      <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
        <div className="font-medium text-sm text-gray-900 line-clamp-1 group-hover:text-black transition-colors" data-testid={`bundle-product-name-${product.id}`}>{product.name}</div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {isPrimary && <span className="text-[10px] text-gray-400 uppercase tracking-wide">Ana Ürün</span>}
          {isFree && <span className="text-[10px] text-emerald-600 uppercase tracking-wide">Ücretsiz</span>}
          {!product.in_stock && <span className="text-[10px] text-red-500 uppercase tracking-wide">Stokta Yok</span>}
        </div>
      </div>
      <div className="text-right pl-2">
        <div className={`text-sm font-semibold ${isFree && checked ? 'text-emerald-600' : 'text-gray-900'}`}>
          {isFree && checked ? 'BEDAVA' : `₺${(product.price || 0).toFixed(2)}`}
        </div>
        {isFree && checked && <div className="text-[11px] text-gray-400 line-through">₺{(product.price || 0).toFixed(2)}</div>}
      </div>
    </label>
  );
}

export default function BundleModuleMinimal({ productId }) {
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
      <div className="p-5 bg-gray-50/50 rounded-xl" data-testid="bundle-module-loading">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!campaigns.length) return null;

  return (
    <div className="space-y-6" data-testid="bundle-module">
      {campaigns.map(c => <BundleCard key={c.id} campaign={c} onAddBundle={addBundle} />)}
    </div>
  );
}

function BundleCard({ campaign, onAddBundle }) {
  const countdown = useCountdown(campaign.end_at);
  const expired = countdown?.expired === true;

  const allProducts = useMemo(() => {
    const list = [];
    if (campaign.primary_product) list.push({ p: campaign.primary_product, isPrimary: true, isFree: false });
    for (const r of (campaign.related_products || [])) list.push({ p: r, isPrimary: false, isFree: false });
    if (campaign.free_product && campaign.type === 'buy_x_get_y') {
      list.push({ p: campaign.free_product, isPrimary: false, isFree: true });
    }
    return list.slice(0, 3);
  }, [campaign]);

  const [selected, setSelected] = useState(() => {
    const init = {};
    for (const x of allProducts) init[x.p.id] = true;
    return init;
  });

  const [busy, setBusy] = useState(false);

  const selectedItems = useMemo(
    () => allProducts.filter(x => selected[x.p.id] && x.p?.in_stock !== false),
    [allProducts, selected]
  );

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
      breakdown = `%${campaign.discount_pct} indirim sağlandı`;
    } else if (t === 'fixed_amount_bundle' && primarySelected && selectedItems.length >= 2) {
      discount = Math.min(campaign.discount_amount || 0, subtotal);
      breakdown = `Birlikte alımda -₺${(campaign.discount_amount || 0).toFixed(2)}`;
    } else if (t === 'buy_x_get_y') {
      const free = selectedItems.find(x => x.isFree);
      if (primarySelected && free) {
        discount = (free.p.price || 0) * (campaign.free_qty || 1);
        breakdown = `${campaign.free_qty || 1} adet ücretsiz eklendi`;
      }
    } else if (t === 'quantity_break' && primarySelected) {
      const tier = (campaign.quantity_tiers || []).slice().sort((a, b) => a.min_qty - b.min_qty).reverse().find(tr => 1 >= tr.min_qty);
      if (tier) {
        discount = (campaign.primary_product?.price || 0) * tier.discount_pct / 100;
        breakdown = `%${tier.discount_pct} miktar indirimi`;
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
      const ids = selectedItems.map(x => x.p.id);
      const r = await api.post('/campaigns/calculate', { campaign_id: campaign.id, selected_product_ids: ids });
      if (!r.data?.valid) {
        toast.error(r.data?.reason || 'Kampanya geçerli değil.');
        setBusy(false);
        return;
      }
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
      toast.success('Birlikte alım sepete eklendi');
    } catch (err) {
      toast.error('Eklenemedi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gray-50/50 rounded-xl p-5" data-testid={`bundle-card-${campaign.id}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-base" data-testid="bundle-title">
            {campaign.name}
          </h3>
          {campaign.badge_text && (
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
              {campaign.badge_text}
            </span>
          )}
        </div>
        {campaign.description && (
          <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
        )}
      </div>

      {campaign.end_at && (
        <div className="mb-4 text-xs text-orange-600 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Kampanya bitimi: <span className="font-mono">{countdown?.label || '—'}</span>
        </div>
      )}

      {anyOutOfStock && (
        <div className="mb-4 text-xs text-red-600 font-medium">
          Bu kampanyadaki bazı ürünler stokta yok.
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-xl px-4 border border-gray-100 shadow-sm">
        {allProducts.map((x, i) => (
          <BundleProductRow
            key={x.p.id}
            product={x.p}
            isPrimary={x.isPrimary}
            isFree={x.isFree}
            checked={!!selected[x.p.id]}
            disabled={x.p.in_stock === false}
            onToggle={toggle}
          />
        ))}
      </div>

      {/* Totals & Action */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          {calc.discount > 0 && (
            <div className="text-xs text-gray-500 line-through">
              Toplam: ₺{calc.subtotal.toFixed(2)}
            </div>
          )}
          <div className="text-xl font-bold text-gray-900" data-testid="bundle-total">
            ₺{calc.total.toFixed(2)}
          </div>
          {calc.breakdown && (
            <div className="text-[11px] font-medium text-emerald-600">
              {calc.breakdown}
            </div>
          )}
        </div>

        <Button
          onClick={handleAdd}
          disabled={ctaDisabled}
          className="w-full sm:w-auto px-8 h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-medium"
          data-testid="bundle-add-button"
        >
          {expired ? 'Sona Erdi' : (anyOutOfStock ? 'Stokta Yok' : 'Hepsini Sepete Ekle')}
        </Button>
      </div>
    </div>
  );
}
