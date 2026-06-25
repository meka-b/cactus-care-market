import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSEO } from '@/lib/seo';

function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}
    </div>
  );
}

function ReviewList({ status }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/reviews', { params: status ? { status } : {} }).then(r => setItems(r.data.items)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const setStatus = async (id, s) => {
    try { await api.patch(`/admin/reviews/${id}`, { status: s }); toast.success('Güncellendi'); load(); } catch { toast.error('Hata'); }
  };
  const onDelete = (id) => {
    toast('Silinsin mi?', {
      action: {
        label: 'Sil',
        onClick: async () => {
          try {
            await api.delete(`/admin/reviews/${id}`);
            toast.success('Silindi');
            load();
          } catch (err) { toast.error('Silinemedi'); }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  if (loading) return <div className="shimmer h-24 rounded-xl" />;
  if (items.length === 0) return <Card className="p-8 text-center bg-white text-muted-foreground">Yorum yok.</Card>;

  return (
    <div className="space-y-3">
      {items.map(rv => (
        <Card key={rv.id} className="p-4 bg-white" data-testid={`admin-review-${rv.id}`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><strong>{rv.name}</strong><Stars value={rv.rating} /><span className="text-xs text-muted-foreground">{new Date(rv.created_at).toLocaleString('tr-TR')}</span></div>
              <div className="text-xs text-muted-foreground mt-0.5">Ürün: {rv.product_slug}</div>
              <p className="mt-2 text-sm">{rv.comment}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant="outline">{rv.status}</Badge>
              <div className="flex gap-1">
                {rv.status !== 'approved' && <Button size="sm" onClick={() => setStatus(rv.id, 'approved')} className="bg-primary text-white hover:bg-emerald-600" data-testid={`approve-${rv.id}`}><CheckCircle2 className="w-3.5 h-3.5" /></Button>}
                {rv.status !== 'rejected' && <Button size="sm" variant="outline" onClick={() => setStatus(rv.id, 'rejected')}><XCircle className="w-3.5 h-3.5" /></Button>}
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(rv.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  useSEO({ title: 'Yorumlar - Yönetim' });
  return (
    <div data-testid="admin-reviews-page">
      <h1 className="text-2xl font-semibold font-heading mb-4">Yorumlar</h1>
      <Tabs defaultValue="pending">
        <TabsList className="bg-[hsl(var(--secondary))]">
          <TabsTrigger value="pending" data-testid="reviews-tab-pending">Onay Bekleyen</TabsTrigger>
          <TabsTrigger value="approved" data-testid="reviews-tab-approved">Onaylanmış</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="reviews-tab-rejected">Reddedilmiş</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4"><ReviewList status="pending" /></TabsContent>
        <TabsContent value="approved" className="mt-4"><ReviewList status="approved" /></TabsContent>
        <TabsContent value="rejected" className="mt-4"><ReviewList status="rejected" /></TabsContent>
      </Tabs>
    </div>
  );
}
