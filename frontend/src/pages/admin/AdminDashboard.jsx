import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Package, ShoppingCart, TrendingUp, Calendar, Users, ShoppingBag, CreditCard, Activity } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useOutletContext } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const { setRightPanel } = useOutletContext() || {};
  useSEO({ title: 'Yönetim - Dashboard' });

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (setRightPanel) {
      setRightPanel(
        <div className="space-y-4">
          <Card className="p-5 bg-white shadow-sm border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Sistem Durumu
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sunucu</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Çalışıyor
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Veritabanı</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bağlı
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mistral AI</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hazır
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-emerald-50 shadow-sm border-emerald-100">
            <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Haftalık İpucu
            </h3>
            <p className="text-emerald-700 text-sm leading-relaxed">
              Ürünlerinize kaliteli görseller eklemek ve açıklamalarda anahtar kelimeler kullanmak satışları %40'a kadar artırabilir.
            </p>
          </Card>
        </div>
      );
    }
    return () => setRightPanel && setRightPanel(null);
  }, [setRightPanel]);

  if (!stats) return <div className="p-6">Yükleniyor...</div>;

  const cards = [
    { label: 'Toplam Ürün', value: stats.total_products, icon: Package, color: 'text-primary' },
    { label: 'Yayındaki Ürün', value: stats.published_products, icon: Package, color: 'text-emerald-600' },
    { label: 'Toplam Sipariş', value: stats.total_orders, icon: ShoppingCart, color: 'text-cyan-600' },
    { label: 'Bugünkü Sipariş', value: stats.today_orders, icon: Calendar, color: 'text-amber-600' },
    { label: 'Ödenmiş Sipariş', value: stats.paid_orders, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Toplam Gelir', value: `₺${(stats.total_revenue||0).toFixed(2)}`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-2xl font-semibold font-heading">Dashboard</h1>
      <p className="text-muted-foreground text-sm mt-1">Yeşil Dükkan yönetim özeti</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6" data-testid="admin-kpi-cards">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] grid place-items-center"><Icon className={`w-5 h-5 ${c.color}`} /></div>
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-2xl font-semibold">{c.value}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="p-5 mt-6 bg-white">
        <h2 className="font-semibold font-heading">Hızlı Başlangıç</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. <strong>AI Ürün Ekle</strong> bölümünden bir bitki fotoğrafı yükleyin.</li>
          <li>2. PlantNet + Mistral AI otomatik olarak bitki taksonomisini ve içeriğini üretir.</li>
          <li>3. Fiyat ve stok bilgisi ekleyin, onaylayıp yayına alın.</li>
          <li>4. Ürün otomatik olarak ilgili landing sayfalarında listelenir.</li>
        </ul>
      </Card>
    </div>
  );
}
