import React, { useEffect, useState } from 'react';
import { api, resolveImageUrl } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Eye, Package, AlertCircle } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

export default function AdminProducts() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { setRightPanel } = useOutletContext() || {};

  useSEO({ title: 'Ürünler - Yönetim' });

  const load = () => {
    setLoading(true);
    api.get('/admin/products', { params: { search, limit: 100 } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    if (setRightPanel) {
      const outOfStock = data.items.filter(p => p.stock <= 0).length;
      const totalStock = data.items.reduce((acc, p) => acc + (p.stock || 0), 0);
      
      setRightPanel(
        <div className="space-y-4">
          <Card className="p-5 bg-white shadow-sm border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              Stok Özeti
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-2xl font-bold text-slate-800">{data.total}</div>
                <div className="text-xs text-slate-500 font-medium">Kayıtlı Ürün</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-2xl font-bold text-slate-800">{totalStock}</div>
                <div className="text-xs text-slate-500 font-medium">Toplam Stok</div>
              </div>
            </div>
            {outOfStock > 0 && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p><strong>{outOfStock}</strong> ürünün stoğu tükenmiş. Hemen güncellemeniz önerilir.</p>
              </div>
            )}
          </Card>
        </div>
      );
    }
    return () => setRightPanel && setRightPanel(null);
  }, [data, setRightPanel]);

  const onDelete = (id, name) => {
    toast(`"${name}" silinecek. Emin misiniz?`, {
      action: {
        label: 'Sil',
        onClick: async () => {
          try {
            await api.delete(`/admin/products/${id}`);
            toast.success('Ürün silindi');
            load();
          } catch (err) { toast.error('Silme başarısız'); }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  return (
    <div data-testid="admin-products-page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold font-heading">Ürünler ({data.total})</h1>
        <Link to="/admin/urun-ekle"><Button className="bg-primary text-white hover:bg-emerald-600">+ Yeni Ürün</Button></Link>
      </div>
      <Input placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs mb-4" data-testid="admin-products-search" />
      {loading ? (
        <div className="shimmer h-32 rounded-xl" />
      ) : data.items.length === 0 ? (
        <Card className="p-10 text-center bg-white"><p className="text-muted-foreground">Henüz ürün yok. AI Ürün Ekle ile başlayın.</p></Card>
      ) : (
        <Card className="bg-white overflow-x-auto" data-testid="admin-products-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[hsl(var(--secondary))] text-left">
                <th className="p-3">Görsel</th><th className="p-3">Ürün</th><th className="p-3">Kategori</th><th className="p-3">Fiyat</th><th className="p-3">Stok</th><th className="p-3">Durum</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(p => (
                <tr key={p.id} className="border-t border-[hsl(var(--border))]">
                  <td className="p-3">{p.images?.[0]?.thumb && <img src={resolveImageUrl(p.images[0].thumb)} className="w-12 h-12 object-cover rounded-xl" alt="" />}</td>
                  <td className="p-3"><div className="font-medium">{p.common_name_tr}</div><div className="text-xs italic text-muted-foreground">{p.scientific_name}</div></td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3 font-semibold">₺{(p.price || 0).toFixed(2)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">{p.is_published ? <Badge className="bg-green-50 text-green-700 border border-green-200">Yayında</Badge> : <Badge variant="outline">Taslak</Badge>}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Link to={`/u/${p.slug}`} target="_blank"><Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button></Link>
                      <Link to={`/admin/urunler/${p.id}`}><Button size="icon" variant="ghost" data-testid={`admin-product-edit-${p.id}`}><Edit2 className="w-4 h-4" /></Button></Link>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(p.id, p.common_name_tr)} data-testid={`admin-product-delete-${p.id}`}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
