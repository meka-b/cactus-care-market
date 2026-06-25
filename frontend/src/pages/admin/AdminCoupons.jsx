import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Edit2, Plus, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';

const TYPES = [
  { value: 'percentage', label: 'Yüzde İndirim (%)' },
  { value: 'fixed_amount', label: 'Sabit Tutar (₺)' },
  { value: 'free_shipping', label: 'Ücretsiz Kargo' },
];

const BLANK = { code: '', type: 'percentage', value: 10, min_order: 0, max_uses: null, valid_until: '', is_active: true, description: '' };

export default function AdminCoupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);

  useSEO({ title: 'Kuponlar - Yönetim' });

  const load = () => {
    setLoading(true);
    api.get('/admin/coupons').then(r => setItems(r.data.items)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type, value: c.value, min_order: c.min_order, max_uses: c.max_uses || null,
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : '',
      is_active: c.is_active, description: c.description || '',
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form };
      payload.value = parseFloat(payload.value) || 0;
      payload.min_order = parseFloat(payload.min_order) || 0;
      payload.max_uses = payload.max_uses ? parseInt(payload.max_uses) : null;
      payload.valid_until = payload.valid_until ? new Date(payload.valid_until).toISOString() : null;
      if (editing) await api.patch(`/admin/coupons/${editing.id}`, payload);
      else await api.post('/admin/coupons', payload);
      toast.success(editing ? 'Kupon güncellendi' : 'Kupon eklendi');
      setOpen(false); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kaydedilemedi');
    }
  };

  const onDelete = (id, code) => {
    toast(`"${code}" kuponu silinecek. Emin misiniz?`, {
      action: {
        label: 'Sil',
        onClick: async () => {
          try {
            await api.delete(`/admin/coupons/${id}`);
            toast.success('Silindi');
            load();
          } catch (err) { toast.error('Hata'); }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  const formatValue = (c) => {
    if (c.type === 'percentage') return `%${c.value}`;
    if (c.type === 'fixed_amount') return `₺${c.value.toFixed(2)}`;
    return 'Ücretsiz kargo';
  };

  return (
    <div data-testid="admin-coupons-page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold font-heading">Kuponlar ({items.length})</h1>
        <Button onClick={openNew} className="bg-primary text-white hover:bg-emerald-600" data-testid="admin-coupon-new"><Plus className="w-4 h-4 mr-1" />Yeni Kupon</Button>
      </div>
      {loading ? <div className="shimmer h-32 rounded-xl" /> : items.length === 0 ? (
        <Card className="p-10 text-center bg-white"><Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Henüz kupon yok.</p></Card>
      ) : (
        <Card className="bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[hsl(var(--secondary))] text-left"><th className="p-3">Kod</th><th className="p-3">Tip</th><th className="p-3">Değer</th><th className="p-3">Min Sepet</th><th className="p-3">Kullanım</th><th className="p-3">Durum</th><th className="p-3"></th></tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="border-t border-[hsl(var(--border))]" data-testid={`admin-coupon-row-${c.id}`}>
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="p-3">{TYPES.find(t => t.value === c.type)?.label || c.type}</td>
                  <td className="p-3 font-semibold text-primary">{formatValue(c)}</td>
                  <td className="p-3">₺{(c.min_order || 0).toFixed(2)}</td>
                  <td className="p-3">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td className="p-3">{c.is_active ? <Badge className="bg-green-50 text-green-700 border border-green-200">Aktif</Badge> : <Badge variant="outline">Pasif</Badge>}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(c.id, c.code)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Kupon Düzenle' : 'Yeni Kupon'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Kupon Kodu</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="YESIL10" data-testid="coupon-code-input" /></div>
            <div className="col-span-2"><Label>Tip</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.type !== 'free_shipping' && (
              <div><Label>Değer {form.type === 'percentage' ? '(%)' : '(₺)'}</Label><Input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
            )}
            <div><Label>Min Sepet (₺)</Label><Input type="number" step="0.01" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} /></div>
            <div><Label>Max Kullanım (boş=sınırsız)</Label><Input type="number" value={form.max_uses ?? ''} onChange={e => setForm({ ...form, max_uses: e.target.value || null })} /></div>
            <div><Label>Bitiş Tarihi</Label><Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
            <div className="col-span-2"><Label>Açıklama</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="col-span-2"><label className="flex items-center gap-2"><Checkbox checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: !!v })} /><span>Aktif</span></label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={save} className="bg-primary text-white hover:bg-emerald-600" data-testid="coupon-save-button">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
