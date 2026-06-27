import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';
import { resolveImageUrl } from '@/lib/api';
import { Package, Truck, User, MapPin, Mail, CreditCard, CheckCircle2, ChevronRight, MessageSquare, Send } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid: { label: 'Ödendi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  failed: { label: 'Başarısız', color: 'bg-red-100 text-red-800 border-red-200' },
  shipped: { label: 'Kargolandı', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'İptal Edildi', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Tracking & Message State
  const [trackingCode, setTrackingCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useSEO({ title: 'Siparişler - Yönetim' });

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.items || []);
    } catch {
      toast.error('Siparişler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (id) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const { data } = await api.get(`/admin/orders/${id}`);
      setSelectedOrder(data);
      setTrackingCode(data.tracking_code || '');
    } catch {
      toast.error('Sipariş detayı yüklenemedi.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (status) => {
    try {
      await api.patch(`/admin/orders/${selectedOrder.id}`, { status });
      toast.success('Durum güncellendi');
      setSelectedOrder({ ...selectedOrder, status });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status } : o));
    } catch {
      toast.error('Güncellenemedi');
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingCode.trim()) return toast.error('Takip kodu boş olamaz.');
    try {
      await api.patch(`/admin/orders/${selectedOrder.id}`, { tracking_code: trackingCode, status: 'shipped' });
      toast.success('Kargo takip kodu eklendi. Sipariş durumu "Kargolandı" olarak güncellendi.');
      setSelectedOrder({ ...selectedOrder, tracking_code: trackingCode, status: 'shipped' });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'shipped' } : o));
    } catch {
      toast.error('Kargo kodu kaydedilemedi.');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSendingMessage(true);
    // Simulate Resend API Call
    setTimeout(() => {
      setIsSendingMessage(false);
      setMessage('');
      toast.success('E-posta başarıyla gönderildi (Resend simulasyonu).');
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      
      {/* LEFT PANEL: Order List */}
      <div className="w-full md:w-1/3 xl:w-1/4 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            Siparişler
            <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">{orders.length}</span>
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-20 rounded-xl" />)
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">Kayıtlı sipariş yok.</p>
          ) : (
            orders.map(o => (
              <button
                key={o.id}
                onClick={() => loadOrderDetail(o.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedId === o.id 
                    ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm' 
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <Badge variant="outline" className={`${STATUS_CONFIG[o.status]?.color || 'bg-gray-100'} border px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold`}>
                    {STATUS_CONFIG[o.status]?.label || o.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-gray-800 line-clamp-1">{o.address?.full_name || 'İsimsiz'}</div>
                <div className="flex justify-between items-end mt-2">
                  <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="font-semibold text-gray-900">₺{o.total.toFixed(2)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Order Detail */}
      <div className="w-full md:w-2/3 xl:w-3/4 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Package className="w-16 h-16 text-gray-200 mb-4" />
            <p>Detayları görmek için listeden bir sipariş seçin.</p>
          </div>
        ) : detailLoading ? (
          <div className="p-8 space-y-6">
            <div className="shimmer h-8 w-1/3 rounded-xl" />
            <div className="shimmer h-32 rounded-xl" />
            <div className="shimmer h-64 rounded-xl" />
          </div>
        ) : selectedOrder ? (
          <div className="flex-1 overflow-y-auto bg-gray-50/30">
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  Sipariş #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  <Badge className={`${STATUS_CONFIG[selectedOrder.status]?.color || 'bg-gray-100'}`}>
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedOrder.created_at).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedOrder.status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Durum Seç" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Products & Messaging */}
              <div className="xl:col-span-2 space-y-6">
                {/* Order Items */}
                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Satın Alınan Ürünler
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm">
                      <tbody>
                        {selectedOrder.items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0 group">
                            <td className="p-4 w-16">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                {item.image ? (
                                  <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 m-auto mt-3 text-gray-300" />
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">{item.slug}</div>
                            </td>
                            <td className="p-4 text-center font-medium text-gray-600">x{item.quantity}</td>
                            <td className="p-4 text-right font-semibold text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Ara Toplam:</span><span>₺{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span></div>
                      {selectedOrder.shipping > 0 && <div className="flex justify-between text-gray-500"><span>Kargo:</span><span>₺{selectedOrder.shipping?.toFixed(2)}</span></div>}
                      {selectedOrder.discount > 0 && <div className="flex justify-between text-emerald-600"><span>İndirim:</span><span>-₺{selectedOrder.discount?.toFixed(2)}</span></div>}
                      <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                        <span>Toplam:</span><span>₺{selectedOrder.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Messaging Panel */}
                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Müşteriye E-Posta Gönder (Resend)
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">
                      Bu mesaj doğrudan müşterinin <span className="font-medium text-gray-800">{selectedOrder.email}</span> adresine SMTP üzerinden iletilecektir.
                    </p>
                    <textarea 
                      className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none text-sm"
                      placeholder="Merhaba, siparişiniz ile ilgili..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                    <div className="mt-3 flex justify-end">
                      <Button onClick={handleSendMessage} disabled={isSendingMessage || !message.trim()} className="bg-gray-900 text-white gap-2 rounded-xl">
                        {isSendingMessage ? 'Gönderiliyor...' : 'Gönder'} <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Customer & Shipping */}
              <div className="space-y-6">
                {/* Shipping & Tracking */}
                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Kargo & Teslimat
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Kargo Firması</label>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">YK</div>
                        Yurtiçi Kargo
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Takip Kodu</label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Örn: 1029384756" 
                          value={trackingCode}
                          onChange={(e) => setTrackingCode(e.target.value)}
                          className="bg-gray-50 border-gray-200 rounded-xl font-mono text-sm"
                        />
                        <Button onClick={handleSaveTracking} variant="outline" className="shrink-0 rounded-xl border-gray-200 hover:bg-gray-50">
                          Kaydet
                        </Button>
                      </div>
                      {selectedOrder.tracking_code && (
                        <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Takip kodu sisteme işlendi.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Customer Details */}
                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> Müşteri Bilgileri
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="font-semibold text-gray-900">{selectedOrder.address?.full_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" /> {selectedOrder.email}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><MapPin className="w-3.5 h-3.5" /> {selectedOrder.address?.phone || '-'}</div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Teslimat Adresi</label>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {selectedOrder.address?.address_line1}<br/>
                        {selectedOrder.address?.address_line2 && <>{selectedOrder.address.address_line2}<br/></>}
                        {selectedOrder.address?.district}, {selectedOrder.address?.city} {selectedOrder.address?.zipcode}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Payment Info */}
                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Ödeme Özeti
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Yöntem</span>
                      <span className="font-medium text-gray-900 capitalize">{selectedOrder.payment_provider}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Durum</span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {selectedOrder.payment_status || 'Başarılı'}
                      </Badge>
                    </div>
                    {selectedOrder.payment_ref && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Referans</span>
                        <span className="font-mono text-xs text-gray-600">{selectedOrder.payment_ref}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
