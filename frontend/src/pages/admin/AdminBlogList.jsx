import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';

export default function AdminBlogList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useSEO({ title: 'Blog - Yönetim' });

  const load = () => { setLoading(true); api.get('/admin/blog').then(r => setItems(r.data.items)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const onDelete = (id, title) => {
    toast(`"${title}" silinecek. Emin misiniz?`, {
      action: {
        label: 'Sil',
        onClick: async () => {
          try {
            await api.delete(`/admin/blog/${id}`);
            toast.success('Yazı silindi');
            load();
          } catch (err) { toast.error('Hata'); }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  return (
    <div data-testid="admin-blog-list">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold font-heading">Blog Yazıları ({items.length})</h1>
        <Link to="/admin/blog/yeni"><Button className="bg-primary text-white hover:bg-emerald-600" data-testid="admin-blog-new"><Plus className="w-4 h-4 mr-1" />Yeni Yazı</Button></Link>
      </div>
      {loading ? <div className="shimmer h-32 rounded-xl" /> : items.length === 0 ? (
        <Card className="p-10 text-center bg-white"><p className="text-muted-foreground">Henüz yazı yok. İlk yazınızı ekleyin.</p></Card>
      ) : (
        <Card className="bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[hsl(var(--secondary))] text-left"><th className="p-3">Başlık</th><th className="p-3">Slug</th><th className="p-3">Durum</th><th className="p-3">Görüntü</th><th className="p-3">Tarih</th><th className="p-3"></th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-t border-[hsl(var(--border))]">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 font-mono text-xs">{p.slug}</td>
                  <td className="p-3">{p.status === 'published' ? <Badge className="bg-green-50 text-green-700 border border-green-200">Yayında</Badge> : <Badge variant="outline">Taslak</Badge>}</td>
                  <td className="p-3">{p.view_count || 0}</td>
                  <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {p.status === 'published' && <Link to={`/blog/${p.slug}`} target="_blank"><Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button></Link>}
                      <Link to={`/admin/blog/${p.id}`}><Button size="icon" variant="ghost"><Edit2 className="w-4 h-4" /></Button></Link>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(p.id, p.title)}><Trash2 className="w-4 h-4" /></Button>
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
