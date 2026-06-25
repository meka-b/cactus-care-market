import React, { useEffect, useMemo, useState } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Layers, Plus, Trash2, Edit2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';

const TYPES = [
  { value: 'fixed_bundle',         label: 'Birlikte Al (Sabit Fiyat)' },
  { value: 'percentage_bundle',    label: 'Yüzdesel Bundle İndirimi' },
  { value: 'fixed_amount_bundle',  label: 'Sabit Tutar İndirimi (₺)' },
  { value: 'buy_x_get_y',          label: 'X Al Y Ücretsiz' },
  { value: 'quantity_break',       label: 'Miktar Bazlı (2 al %10, 3 al %15...)' },
];

const BLANK = {
  name: '', type: 'fixed_bundle', is_active: true, priority: 100,
  start_at: '', end_at: '',
  primary_product_id: '', related_product_ids: [],
  bundle_price: 0, discount_pct: 15, discount_amount: 100,
  free_product_id: '', free_qty: 1,
  quantity_tiers: [{ min_qty: 2, discount_pct: 10 }, { min_qty: 3, discount_pct: 15 }],
  description: '', badge_text: '',
};

function ProductPicker({ value, onChange, multiple = false, label, testid, exclude = [] }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState({});  // id -> product

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim() || !open) { setResults([]); return; }
      api.get(`/admin/products/search?q=${encodeURIComponent(q)}`)
        .then(r => setResults(r.data.items || []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  // Hydrate picked products for display (in case page is loaded with existing IDs)
  useEffect(() => {
    const ids = multiple ? (value || []) : (value ? [value] : []);
    const missing = ids.filter(id => id && !picked[id]);
    if (missing.length) {
      Promise.all(missing.map(id => api.get(`/admin/products/by-id/${id}`).then(r => r.data).catch(() => null)))
        .then(list => {
          const m = { ...picked };
          for (const p of list) if (p?.id) m[p.id] = p;
          setPicked(m);
        });
    }
  }, [value, multiple]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = (p) => {
    setPicked(prev => ({ ...prev, [p.id]: p }));
    if (multiple) {
      const arr = value || [];
      if (!arr.includes(p.id) && !exclude.includes(p.id)) onChange([...arr, p.id]);
    } else {
      onChange(p.id);
      setOpen(false);
    }
    setQ('');
  };

  const removeId = (id) => {
    if (multiple) onChange((value || []).filter(x => x !== id));
    else onChange('');
  };

  const ids = multiple ? (value || []) : (value ? [value] : []);

  return (
    <div data-testid={testid || 'product-picker'}>
      {label && <Label className="mb-1 block">{label}</Label>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {ids.map(id => {
          const p = picked[id];
          return (
            <Badge key={id} variant="outline" className="gap-1 pl-2 pr-1 py-1 bg-[hsl(var(--secondary))]">
              <span className="text-xs">{p?.common_name_tr || id.slice(0, 8)}</span>
              <button type="button" onClick={() => removeId(id)} className="hover:text-red-500" aria-label="Kaldır"><X className="w-3 h-3" /></button>
            </Badge>
          );
        })}
        {(!ids.length || multiple) && (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(o => !o)} className="h-7">
            <Search className="w-3.5 h-3.5 mr-1" /> Ürün Ara
          </Button>
        )}
      </div>
      {open && (
        <Card className="p-2 mt-1 bg-white border-primary/20">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ürün adı yazın..." autoFocus />
          {!!results.length && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {results.filter(r => !exclude.includes(r.id) && !ids.includes(r.id)).map(r => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => handlePick(r)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-sm"
                >
                  {r.common_name_tr}
                  <span className="text-[10px] text-muted-foreground ml-2">₺{(r.price || 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function AdminCampaigns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);

  useSEO({ title: 'Kampanyalar - Yönetim' });

  const load = () => {
    setLoading(true);
    api.get('/admin/campaigns').then(r => setItems(r.data.items || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name, type: c.type, is_active: c.is_active, priority: c.priority,
      start_at: c.start_at ? c.start_at.slice(0, 16) : '',
      end_at: c.end_at ? c.end_at.slice(0, 16) : '',
      primary_product_id: c.primary_product_id, related_product_ids: c.related_product_ids || [],
      bundle_price: c.bundle_price ?? 0,
      discount_pct: c.discount_pct ?? 15,
      discount_amount: c.discount_amount ?? 100,
      free_product_id: c.free_product_id || '',
      free_qty: c.free_qty || 1,
      quantity_tiers: c.quantity_tiers && c.quantity_tiers.length ? c.quantity_tiers : BLANK.quantity_tiers,
      description: c.description || '', badge_text: c.badge_text || '',
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form };
      if (payload.start_at) payload.start_at = new Date(payload.start_at).toISOString();
      else payload.start_at = null;
      if (payload.end_at) payload.end_at = new Date(payload.end_at).toISOString();
      else payload.end_at = null;
      // Strip irrelevant fields per type to keep DB tidy
      const t = payload.type;
      if (t !== 'fixed_bundle') payload.bundle_price = null;
      if (t !== 'percentage_bundle') payload.discount_pct = null;
      if (t !== 'fixed_amount_bundle') payload.discount_amount = null;
      if (t !== 'buy_x_get_y') { payload.free_product_id = null; payload.free_qty = 1; }
      if (t !== 'quantity_break') payload.quantity_tiers = [];

      if (editing) {
        await api.patch(`/admin/campaigns/${editing.id}`, payload);
        toast.success('Kampanya güncellendi');
      } else {
        await api.post('/admin/campaigns', payload);
        toast.success('Kampanya oluşturuldu');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kaydedilemedi');
    }
  };

  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/campaigns/${deleteId}`);
      toast.success('Kampanya silindi');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error('Silinirken hata oluştu');
      setDeleteId(null);
    }
  };

  const typeLabel = (t) => TYPES.find(x => x.value === t)?.label || t;

  const typeShortValue = (c) => {
    switch (c.type) {
      case 'fixed_bundle': return `₺${(c.bundle_price || 0).toFixed(2)}`;
      case 'percentage_bundle': return `%${c.discount_pct || 0}`;
      case 'fixed_amount_bundle': return `-₺${(c.discount_amount || 0).toFixed(2)}`;
      case 'buy_x_get_y': return `${c.free_qty || 1} adet bedava`;
      case 'quantity_break': return `${(c.quantity_tiers || []).map(t => `${t.min_qty}+:${t.discount_pct}%`).join(' / ')}`;
      default: return '-';
    }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateTier = (i, k, v) => {
    setForm(f => {
      const tiers = [...(f.quantity_tiers || [])];
      tiers[i] = { ...tiers[i], [k]: v };
      return { ...f, quantity_tiers: tiers };
    });
  };
  const addTier = () => setForm(f => ({ ...f, quantity_tiers: [...(f.quantity_tiers || []), { min_qty: 5, discount_pct: 20 }] }));
  const removeTier = (i) => setForm(f => ({ ...f, quantity_tiers: (f.quantity_tiers || []).filter((_, idx) => idx !== i) }));

  return (
    <div data-testid="admin-campaigns-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold font-heading">Kampanyalar (Bundle)</h1>
        </div>
        <Button onClick={openNew} className="bg-primary text-white hover:bg-emerald-600" data-testid="campaign-new-button">
          <Plus className="w-4 h-4 mr-1" /> Yeni Kampanya
        </Button>
      </div>

      {loading ? (
        <Card className="p-6">Yükleniyor...</Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center" data-testid="campaign-empty">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">Henüz kampanya oluşturulmadı.</p>
          <Button onClick={openNew} variant="outline">İlk Kampanyayı Oluştur</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map(c => (
            <Card key={c.id} className="p-4 flex flex-wrap items-center gap-4" data-testid={`campaign-item-${c.id}`}>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{c.name}</h3>
                  {c.is_active ? (
                    <Badge className="bg-green-50 text-green-700 border border-green-200">Aktif</Badge>
                  ) : (
                    <Badge variant="outline">Pasif</Badge>
                  )}
                  {c.badge_text && <Badge className="bg-primary text-white border-0">{c.badge_text}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{typeLabel(c.type)} • {typeShortValue(c)}</div>
                <div className="text-xs text-muted-foreground">Öncelik: {c.priority} • {c.related_product_ids?.length || 0} ek ürün</div>
                {(c.start_at || c.end_at) && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {c.start_at ? `Başl: ${new Date(c.start_at).toLocaleDateString('tr-TR')}` : 'Hemen'} → {c.end_at ? `Bit: ${new Date(c.end_at).toLocaleDateString('tr-TR')}` : 'Sürekli'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)} data-testid={`campaign-edit-${c.id}`}><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteId(c.id)} data-testid={`campaign-delete-${c.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="campaign-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Kampanyayı Düzenle' : 'Yeni Kampanya'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Kampanya Adı *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Örn: Kaktüs + Saksı Birlikte Al" data-testid="campaign-name-input" /></div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Kampanya Tipi *</Label>
                <Select value={form.type} onValueChange={v => update('type', v)} data-testid="campaign-type-select">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1"><Label>Öncelik (küçük = yüksek)</Label><Input type="number" value={form.priority} onChange={e => update('priority', Number(e.target.value))} /></div>

              <div className="col-span-2 sm:col-span-1"><Label>Başlangıç (opsiyonel)</Label><Input type="datetime-local" value={form.start_at} onChange={e => update('start_at', e.target.value)} /></div>
              <div className="col-span-2 sm:col-span-1"><Label>Bitiş (opsiyonel)</Label><Input type="datetime-local" value={form.end_at} onChange={e => update('end_at', e.target.value)} data-testid="campaign-endat-input" /></div>

              <div className="col-span-2">
                <ProductPicker
                  label="Ana Ürün *"
                  value={form.primary_product_id}
                  onChange={(id) => update('primary_product_id', id)}
                  testid="campaign-primary-picker"
                />
              </div>

              {/* Type-specific value fields */}
              {form.type === 'fixed_bundle' && (
                <div className="col-span-2 sm:col-span-1"><Label>Birlikte Toplam Fiyat (₺) *</Label><Input type="number" min="0" step="0.01" value={form.bundle_price} onChange={e => update('bundle_price', Number(e.target.value))} data-testid="campaign-bundle-price" /></div>
              )}
              {form.type === 'percentage_bundle' && (
                <div className="col-span-2 sm:col-span-1"><Label>İndirim Yüzdesi (%) *</Label><Input type="number" min="1" max="100" value={form.discount_pct} onChange={e => update('discount_pct', Number(e.target.value))} data-testid="campaign-pct" /></div>
              )}
              {form.type === 'fixed_amount_bundle' && (
                <div className="col-span-2 sm:col-span-1"><Label>İndirim Tutarı (₺) *</Label><Input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e => update('discount_amount', Number(e.target.value))} data-testid="campaign-amount" /></div>
              )}
              {form.type === 'buy_x_get_y' && (
                <>
                  <div className="col-span-2">
                    <ProductPicker
                      label="Ücretsiz Verilecek Ürün *"
                      value={form.free_product_id}
                      onChange={(id) => update('free_product_id', id)}
                      exclude={[form.primary_product_id]}
                      testid="campaign-free-picker"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1"><Label>Adet</Label><Input type="number" min="1" value={form.free_qty} onChange={e => update('free_qty', Number(e.target.value))} /></div>
                </>
              )}

              {/* Related products for bundle types (not for quantity_break) */}
              {['fixed_bundle', 'percentage_bundle', 'fixed_amount_bundle', 'buy_x_get_y'].includes(form.type) && (
                <div className="col-span-2">
                  <ProductPicker
                    label="Birlikte Önerilecek Ek Ürünler (max 2)"
                    value={form.related_product_ids}
                    onChange={(ids) => update('related_product_ids', ids.slice(0, 2))}
                    multiple
                    exclude={[form.primary_product_id, form.free_product_id].filter(Boolean)}
                    testid="campaign-related-picker"
                  />
                </div>
              )}

              {/* Quantity tiers */}
              {form.type === 'quantity_break' && (
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Kademeli İndirimler</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addTier}><Plus className="w-3 h-3 mr-1" /> Ekle</Button>
                  </div>
                  {(form.quantity_tiers || []).map((t, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input type="number" placeholder="Min Adet" value={t.min_qty} onChange={e => updateTier(i, 'min_qty', Number(e.target.value))} />
                      <span className="text-muted-foreground">+</span>
                      <Input type="number" placeholder="% İndirim" value={t.discount_pct} onChange={e => updateTier(i, 'discount_pct', Number(e.target.value))} />
                      <Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={() => removeTier(i)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="col-span-2"><Label>Açıklama / Metin</Label><Input value={form.description} onChange={e => update('description', e.target.value)} placeholder="Örn: Bu ürünle x'i alana y hediye" /></div>
              <div className="col-span-2 sm:col-span-1"><Label>Rozet (Badge) Metni</Label><Input value={form.badge_text} onChange={e => update('badge_text', e.target.value)} placeholder="Örn: Fırsat" /></div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.is_active} onCheckedChange={c => update('is_active', c)} />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={save} className="bg-primary text-white" data-testid="campaign-save">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kampanyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
