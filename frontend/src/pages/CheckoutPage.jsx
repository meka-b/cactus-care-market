import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { api, resolveImageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function CheckoutPage() {
  const { items, bundles, subtotal, bundleDiscount, hasBundles, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null); // { code, type, value, discount, shipping_override }
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutContent, setCheckoutContent] = useState('');
  const [form, setForm] = useState({
    email: user?.email || '',
    full_name: user?.name || '',
    phone: '+905555555555',
    city: 'İstanbul',
    district: 'Kadıköy',
    address_line: '',
    zip_code: '34000',
    notes: '',
  });

  useSEO({ title: 'Ödeme - Yeşil Dükkan' });

  let shipping = subtotal >= 500 ? 0 : 39.90;
  let discount = 0;
  if (coupon && !hasBundles) {
    if (coupon.shipping_override !== null && coupon.shipping_override !== undefined) shipping = coupon.shipping_override;
    discount = coupon.discount || 0;
  }
  const total = Math.max(0, subtotal + shipping - discount - bundleDiscount);

  const applyCoupon = async () => {
    if (hasBundles) {
      toast.info('Bundle kampanyalı sepette kupon kullanılamaz. Önce bundle\'ı kaldırın.');
      return;
    }
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const r = await api.post('/coupons/validate', { code: couponCode.trim().toUpperCase(), subtotal });
      setCoupon({ ...r.data, code: couponCode.trim().toUpperCase() });
      toast.success('Kupon uygulandı');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kupon geçersiz');
      setCoupon(null);
    } finally { setCouponLoading(false); }
  };
  const removeCoupon = () => { setCoupon(null); setCouponCode(''); };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Sepetiniz boş'); return; }
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        address: {
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          district: form.district,
          address_line: form.address_line,
          zip_code: form.zip_code,
        },
        items: items.map(it => ({
          product_id: it.product_id,
          name: it.name,
          slug: it.slug,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          campaign_id: it.campaign_id || null,
        })),
        notes: form.notes,
        coupon_code: hasBundles ? null : (coupon?.code || null),
        applied_campaigns: bundles.map(b => ({
          campaign_id: b.campaign_id,
          items: b.items.map(bi => ({ product_id: bi.product_id, quantity: bi.quantity || 1 })),
        })),
      };
      const r = await api.post('/orders/checkout', payload);
      // Save order ID so on success we can show it
      localStorage.setItem('yd_last_order', r.data.order_id);
      clear();
      
      // Render payment_url inline inside iframe
      if (r.data.payment_url) {
        setCheckoutContent(r.data.payment_url);
        setLoading(false);
      } else {
        toast.error("Ödeme linki alınamadı");
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ödeme başlatılamadı');
      setLoading(false);
    }
  };

  if (items.length === 0 && !checkoutContent) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">Sepetiniz boş.</p>
        <Link to="/"><Button>Alışverişe Devam</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="checkout-page">
      <h1 className="text-3xl font-semibold font-heading mb-6">Ödeme</h1>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left: form or Iyzico */}
        <div className="space-y-6">
          {checkoutContent ? (
            <Card className="p-0 bg-white min-h-[600px] overflow-hidden border-0 shadow-none" data-testid="checkout-iyzipay">
              <iframe 
                title="İyzico Güvenli Ödeme"
                className="w-full h-[650px] border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation allow-top-navigation-by-user-activation allow-popups"
                src={checkoutContent}
              />
            </Card>
          ) : (
            <>
              <Card className="p-6 bg-white">
                <h2 className="font-semibold font-heading mb-4">Teslimat Bilgileri</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><Label>E-posta</Label><Input type="email" required value={form.email} onChange={e => update('email', e.target.value)} data-testid="checkout-email" /></div>
                  <div><Label>Ad Soyad</Label><Input required value={form.full_name} onChange={e => update('full_name', e.target.value)} data-testid="checkout-fullname" /></div>
                  <div><Label>Telefon</Label><Input required value={form.phone} onChange={e => update('phone', e.target.value)} data-testid="checkout-phone" /></div>
                  <div><Label>Şehir</Label><Input required value={form.city} onChange={e => update('city', e.target.value)} data-testid="checkout-city" /></div>
                  <div><Label>İlçe</Label><Input required value={form.district} onChange={e => update('district', e.target.value)} data-testid="checkout-district" /></div>
                  <div className="sm:col-span-2"><Label>Adres</Label><Textarea required value={form.address_line} onChange={e => update('address_line', e.target.value)} placeholder="Mahalle, sokak, kapı no..." data-testid="checkout-address" /></div>
                  <div><Label>Posta Kodu</Label><Input value={form.zip_code} onChange={e => update('zip_code', e.target.value)} data-testid="checkout-zip" /></div>
                </div>
              </Card>
              <Card className="p-6 bg-white">
                <h2 className="font-semibold font-heading mb-2">Sipariş Notu (Opsiyonel)</h2>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Özel istekleriniz..." data-testid="checkout-notes" />
              </Card>
            </>
          )}
        </div>
        {/* Right: summary */}
        <div>
          <Card className="p-6 bg-white sticky top-20">
            <h2 className="font-semibold font-heading mb-4">Sipariş Özeti</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map((i, idx) => (
                <div key={`${i.product_id}-${i.bundle_id || 'p'}-${idx}`} className="flex items-center gap-3 text-sm">
                  {i.image && <img src={resolveImageUrl(i.image)} className="w-12 h-12 object-cover rounded-xl" alt={i.name} />}
                  <div className="flex-1">
                    <div className="line-clamp-1 flex items-center gap-1.5">
                      {i.bundle_id && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-white font-semibold" title="Bundle">B</span>}
                      <span>{i.name}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">{i.quantity} x ₺{i.price.toFixed(2)}</div>
                  </div>
                  <div className="font-medium">₺{(i.quantity * i.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="my-4 border-t border-[hsl(var(--border))]" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ara Toplam</span><span data-testid="checkout-subtotal">₺{subtotal.toFixed(2)}</span></div>
              {bundleDiscount > 0 && (
                <div className="flex justify-between text-primary" data-testid="checkout-bundle-discount-row">
                  <span>Bundle İndirimi ({bundles.length} kampanya)</span>
                  <span data-testid="checkout-bundle-discount">-₺{bundleDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Kargo</span><span>{shipping === 0 ? 'Ücretsiz' : `₺${shipping.toFixed(2)}`}</span></div>
              {discount > 0 && <div className="flex justify-between text-primary"><span>İndirim ({coupon?.code})</span><span data-testid="checkout-discount">-₺{discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-[hsl(var(--border))]"><span>Toplam</span><span data-testid="checkout-total">₺{total.toFixed(2)}</span></div>
            </div>

            {!checkoutContent && (
              <>
                <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                  <Label className="text-xs text-muted-foreground">Kupon Kodu</Label>
                  {hasBundles ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1 text-xs text-amber-800" data-testid="checkout-coupon-disabled-bundle">
                      Sepette kampanyalı bundle bulunduğu için kupon kodu uygulanamaz.
                    </div>
                  ) : coupon ? (
                    <div className="flex items-center justify-between bg-[hsl(var(--secondary))] rounded-xl p-2 mt-1" data-testid="checkout-coupon-applied">
                      <div>
                        <div className="font-mono font-semibold text-primary text-sm">{coupon.code}</div>
                        <div className="text-xs text-muted-foreground">{coupon.coupon?.description || 'Uygulandı'}</div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeCoupon}>Kaldır</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ÖRN: YESIL10" className="font-mono" data-testid="checkout-coupon-input" />
                      <Button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} variant="outline" data-testid="checkout-coupon-apply">{couponLoading ? '...' : 'Uygula'}</Button>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-emerald-600 h-11 mt-5" data-testid="checkout-pay-button">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ödeme hazırlanıyor...</> : <>Ödemeye Geç <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">Güvenli ödeme İyzico ile</p>
              </>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}
