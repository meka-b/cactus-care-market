import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Brain, UploadCloud, Database, FileText, CheckCircle2, Trash2 } from 'lucide-react';

export default function AdminRAG() {
  const [stats, setStats] = useState({ documents: 0, chunks: 0, recent_files: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/rag/stats');
      setStats(data);
    } catch (e) {
      toast.error('İstatistikler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    toast('Bu dökümanı ve ait olan tüm RAG parçalarını silmek istediğinize emin misiniz?', {
      action: {
        label: 'Sil',
        onClick: async () => {
          try {
            await api.delete(`/admin/rag/documents/${id}`);
            toast.success('Döküman silindi.');
            loadStats();
          } catch (e) {
            toast.error('Silme başarısız oldu.');
          }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.json')) {
      return toast.error('Lütfen sadece .md veya .json formatında dosya yükleyin.');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/admin/rag/upload', formData);
      toast.success(data.message || 'Dosya arka planda vektörlere dönüştürülüyor.');
      loadStats();
    } catch (err) {
      toast.error('Dosya işlenirken hata oluştu. (Mistral API anahtarı ayarlı mı kontrol edin)');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleSyncAll = () => {
    toast('Tüm aktif ürünler ve yayınlanmış blog yazıları RAG sistemine senkronize edilecek. Bu işlem biraz zaman alabilir. Onaylıyor musunuz?', {
      action: {
        label: 'Senkronize Et',
        onClick: async () => {
          setSyncing(true);
          try {
            const { data } = await api.post('/admin/rag/sync');
            toast.success(data.message || 'Senkronizasyon başarıyla tamamlandı.');
            loadStats();
          } catch (err) {
            toast.error('Senkronizasyon sırasında hata oluştu.');
          } finally {
            setSyncing(false);
          }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-600" /> Yapay Zeka RAG Eğitimi
          </h1>
          <p className="text-gray-500 mt-1">Yaver Chatbot ve İçerik Üretimi (Blog/Ürün) için sisteme özel bilgi yükleyin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-400" /> Bilgi Bankası Durumu
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">İşlenen Dosyalar</div>
              <div className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.documents}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="text-sm text-indigo-600 mb-1">Eğitilmiş Bilgi Parçası (Chunk)</div>
              <div className="text-3xl font-bold text-indigo-900">{loading ? '-' : stats.chunks}</div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mağazadaki tüm aktif içerikleri (Ürünler ve Bloglar) tek tıkla senkronize edebilirsiniz.
            </div>
            <Button onClick={handleSyncAll} disabled={syncing || loading} className="flex items-center gap-2">
              {syncing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Brain className="w-4 h-4" />}
              {syncing ? 'Senkronize Ediliyor...' : 'Tüm İçerikleri Senkronize Et'}
            </Button>
          </div>
        </Card>

        {/* Upload Area */}
        <Card className="p-6 border-dashed border-2 bg-gray-50/50 relative overflow-hidden group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
          <input
            type="file"
            accept=".md,.json"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 pointer-events-none">
            <div className={`p-4 rounded-full ${uploading ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-white shadow-sm text-gray-400 group-hover:text-indigo-500 group-hover:shadow-md transition-all'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{uploading ? 'Vektörel Veriye Dönüştürülüyor...' : 'Dosya Seç veya Sürükle'}</div>
              <p className="text-sm text-gray-500 mt-1">Sadece .md ve .json (Eğitim dökümanları, blog yazıları, ürün kullanım kılavuzları)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Files */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Son Yüklenen Dokümanlar
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/30 text-left text-gray-500">
              <th className="p-4 font-medium">Dosya Adı</th>
              <th className="p-4 font-medium w-32 text-center">Format</th>
              <th className="p-4 font-medium w-32 text-center">Boyut</th>
              <th className="p-4 font-medium w-48 text-right">Tarih</th>
              <th className="p-4 font-medium w-16 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="p-4 text-center text-gray-400">Yükleniyor...</td></tr>
            ) : stats.recent_files?.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">Henüz bilgi bankasına doküman yüklenmemiş.</td></tr>
            ) : (
              stats.recent_files?.map((f, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f.filename}
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{f.type}</Badge>
                  </td>
                  <td className="p-4 text-center text-gray-500">{f.chars} Krk.</td>
                  <td className="p-4 text-right text-gray-500">{new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 transition-colors p-1" title="Sil">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
