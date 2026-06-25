import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO({ title: 'Siparişim - Yeşil Dükkan' });

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-2xl mx-auto p-10"><div className="shimmer h-64 rounded-xl" /></div>;
  if (!order) return <div className="max-w-2xl mx-auto p-10 text-center"><p>Sipariş bulunamadı.</p></div>;

  const success = order.status === 'paid';
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10" data-testid="order-page">
      <Card className="p-8 bg-white text-center">
        {success ? (
          <CheckCircle2 className="w-16 h-16 mx-auto text-primary mb-3" />
        ) : (
          <XCircle className="w-16 h-16 mx-auto text-amber-500 mb-3" />
        )}
        <h1 className="text-2xl font-semibold font-heading" data-testid="order-status-title">
          {success ? 'Siparişin Alındı!' : 'Sipariş Durumu'}
        </h1>
        <p className="text-muted-foreground mt-2">Sipariş No: <strong className="text-foreground">#{order.id.slice(0,8).toUpperCase()}</strong></p>
        <Badge className="mt-3">{order.status}</Badge>
        <div className="mt-6 space-y-2 text-left bg-[#F7FBF8] rounded-xl p-4">
          <div className="flex justify-between"><span className="text-muted-foreground">E-posta</span><span>{order.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Ürün</span><span>{order.items.length} adet</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Toplam</span><span className="font-semibold">₺{order.total.toFixed(2)}</span></div>
        </div>
        {success && (
          <p className="mt-4 text-sm text-muted-foreground inline-flex items-center justify-center gap-1"><Mail className="w-4 h-4" />Sipariş onayı e-postanıza gönderildi.</p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/"><Button variant="outline">Ana Sayfa</Button></Link>
          <Link to="/hesap/siparislerim"><Button className="bg-primary text-white hover:bg-emerald-600">Siparişlerim</Button></Link>
        </div>
      </Card>
    </div>
  );
}
