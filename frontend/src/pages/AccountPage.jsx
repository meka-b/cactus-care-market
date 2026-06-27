import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api, resolveImageUrl } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { toast } from 'sonner';
import { 
  User, Package, Settings, LogOut, ChevronRight, ShoppingBag, 
  Truck, Eye, MapPin, Search, CreditCard, Lock, Mail
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function AccountPage() {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Settings forms
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useSEO({ title: 'Hesabım - Yeşil Dükkan' });

  useEffect(() => {
    if (user) {
      api.get('/orders').then(r => setOrders(r.data.items)).catch(() => {});
      setProfileName(user.name || '');
    }
  }, [user]);

  if (!user) return (
    <div className="max-w-md mx-auto p-10 mt-10 text-center bg-white rounded-xl border shadow-sm">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
      <p className="text-muted-foreground mb-6">Hesap bilgilerinizi ve siparişlerinizi görmek için giriş yapmanız gerekiyor.</p>
      <Link to="/giris"><Button className="w-full h-12 text-base">Giriş Yap</Button></Link>
    </div>
  );

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.put('/auth/profile', { name: profileName });
      toast.success('Profiliniz başarıyla güncellendi');
      await checkAuth(); // Refresh user context
    } catch (err) {
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Yeni şifre en az 6 karakter olmalıdır');
    setIsUpdating(true);
    try {
      await api.put('/auth/password', { current_password: currentPassword, new_password: newPassword });
      toast.success('Şifreniz başarıyla değiştirildi');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Şifre değiştirilirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'dashboard', label: 'Genel Bakış', icon: User },
    { id: 'orders', label: 'Siparişlerim', icon: Package },
    { id: 'settings', label: 'Hesap Ayarları', icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="account-page">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="bg-white rounded-xl border shadow-sm p-4 sticky top-24">
            <div className="flex items-center gap-4 p-4 mb-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold uppercase">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate">{user.name}</div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
            
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                    {tab.label}
                    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
              
              <div className="my-2 border-t border-gray-100" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium text-left transition-colors"
                data-testid="account-logout-button"
              >
                <LogOut className="w-5 h-5 opacity-80" />
                Çıkış Yap
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900">Hoş Geldin, {user.name}!</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold opacity-90">Toplam Sipariş</h3>
                    <div className="p-2 bg-white/20 rounded-xl"><ShoppingBag className="w-5 h-5" /></div>
                  </div>
                  <div className="text-4xl font-bold">{orders.length}</div>
                  <div className="mt-2 text-sm opacity-80">Bugüne kadar verdiğiniz sipariş sayısı</div>
                </Card>
                
                <Card className="p-6 bg-white border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">Hesap Tipi</h3>
                    <div className="p-2 bg-gray-100 rounded-xl text-gray-600"><User className="w-5 h-5" /></div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">{user.role === 'admin' ? 'Yönetici' : 'Müşteri'}</div>
                  <div className="mt-2 text-sm text-gray-500">Kayıtlı E-posta: {user.email}</div>
                </Card>
              </div>

              <Card className="p-6 bg-white border shadow-sm mt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" /> Son Siparişiniz
                </h3>
                {orders.length > 0 ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900">#{orders[0].id.slice(0,8).toUpperCase()}</div>
                      <div className="text-sm text-gray-500 mt-1">{new Date(orders[0].created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <Button variant="outline" onClick={() => setActiveTab('orders')}>Detaylara Git</Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Henüz siparişiniz bulunmuyor.</p>
                )}
              </Card>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Siparişlerim</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz siparişiniz yok</h3>
                  <p className="text-gray-500 mb-6">Mağazamızı inceleyerek ilk siparişinizi oluşturabilirsiniz.</p>
                  <Link to="/k/kaktusler"><Button>Alışverişe Başla</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(o => (
                    <Card key={o.id} className="overflow-hidden bg-white border shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-lg text-gray-900">#{o.id.slice(0,8).toUpperCase()}</span>
                            <Badge variant="outline" className={
                              o.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              o.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-orange-50 text-orange-700 border-orange-200'
                            }>
                              {o.status === 'completed' ? 'Tamamlandı' : o.status === 'shipped' ? 'Kargoya Verildi' : 'Hazırlanıyor'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" /> {new Date(o.created_at).toLocaleDateString('tr-TR')}</span>
                            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {o.items?.length || 0} Ürün</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                          <div className="text-xl font-bold text-gray-900">₺{(o.total || 0).toFixed(2)}</div>
                          
                          {/* ORDER DETAILS DIALOG */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" /> Detayları Gör
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-gray-50">
                              <DialogHeader className="p-6 bg-white border-b">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DialogTitle className="text-xl">Sipariş Detayı</DialogTitle>
                                    <div className="text-sm text-muted-foreground mt-1">#{o.id.toUpperCase()}</div>
                                  </div>
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                    {o.status === 'completed' ? 'Tamamlandı' : o.status === 'shipped' ? 'Kargoya Verildi' : 'Hazırlanıyor'}
                                  </Badge>
                                </div>
                              </DialogHeader>
                              
                              <ScrollArea className="max-h-[60vh]">
                                <div className="p-6 space-y-6">
                                  
                                  {/* Tracking Info */}
                                  {o.tracking_code && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3 text-blue-900">
                                        <div className="p-2 bg-blue-100 rounded-xl"><Truck className="w-5 h-5" /></div>
                                        <div>
                                          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-0.5">Kargo Takip No</div>
                                          <div className="font-mono font-bold text-base">{o.tracking_code}</div>
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => window.open(`https://kargotakip.com/?code=${o.tracking_code}`, '_blank')}
                                      >
                                        Takip Et
                                      </Button>
                                    </div>
                                  )}

                                  {/* Items List */}
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Sipariş İçeriği</h4>
                                    <div className="space-y-3">
                                      {o.items?.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-3 bg-white rounded-xl border shadow-sm">
                                          <div className="w-16 h-20 rounded-xl bg-gray-100 border overflow-hidden shrink-0">
                                            {item.image ? (
                                              <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full shimmer" />
                                            )}
                                          </div>
                                          <div className="flex-1 flex flex-col justify-center">
                                            <div className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">{item.name}</div>
                                            <div className="text-sm text-gray-500">{item.quantity} Adet x ₺{(item.price || 0).toFixed(2)}</div>
                                            <div className="font-bold text-gray-900 mt-1">₺{((item.price || 0) * item.quantity).toFixed(2)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Summary */}
                                  <div className="bg-white rounded-xl border p-5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Ara Toplam</span>
                                      <span className="font-medium">₺{(o.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Kargo</span>
                                      <span className="font-medium">{o.shipping === 0 ? 'Ücretsiz' : `₺${o.shipping.toFixed(2)}`}</span>
                                    </div>
                                    {(o.discount > 0 || o.bundle_discount > 0) && (
                                      <div className="flex justify-between text-sm text-emerald-600">
                                        <span>İndirim</span>
                                        <span className="font-medium">-₺{((o.discount || 0) + (o.bundle_discount || 0)).toFixed(2)}</span>
                                      </div>
                                    )}
                                    <Separator className="my-1" />
                                    <div className="flex justify-between items-center pt-1">
                                      <span className="font-bold text-gray-900">Genel Toplam</span>
                                      <span className="text-xl font-bold text-primary">₺{(o.total || 0).toFixed(2)}</span>
                                    </div>
                                  </div>

                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                          
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesap Ayarları</h2>
              
              <div className="grid gap-6">
                {/* Profile Form */}
                <Card className="p-6 bg-white border shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><User className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold">Kişisel Bilgiler</h3>
                  </div>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input 
                          id="name" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="h-11" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta (Değiştirilemez)</Label>
                        <Input 
                          id="email" 
                          value={user.email} 
                          disabled 
                          className="h-11 bg-gray-50 text-gray-500" 
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isUpdating} className="h-11 px-8">
                      {isUpdating ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
                    </Button>
                  </form>
                </Card>

                {/* Password Form */}
                <Card className="p-6 bg-white border shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Lock className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold">Şifre Değiştir</h3>
                  </div>
                  <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Mevcut Şifreniz</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        className="h-11" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Yeni Şifreniz</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="h-11" 
                        required 
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" disabled={isUpdating} variant="secondary" className="h-11 px-8 border shadow-sm">
                      {isUpdating ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
