import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Leaf, Loader2 } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useSEO({ title: 'Giriş Yap - Yeşil Dükkan', description: 'Hesabınıza giriş yapın.' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Hoş geldin ${u.name}`);
      navigate(u.role === 'admin' ? '/admin' : '/hesap');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Giriş başarısız');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] grid lg:grid-cols-2">
      <div className="hidden lg:block bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1517021818302-9b520a06c834?w=1200&q=80)" }} />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md p-7 bg-white" data-testid="login-card">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center"><Leaf className="w-5 h-5" /></div>
            <span className="font-semibold font-heading">Yeşil Dükkan</span>
          </div>
          <h1 className="text-2xl font-semibold font-heading">Giriş Yap</h1>
          <p className="text-muted-foreground text-sm mt-1">Hesabınıza giriş yaparak alışverişe devam edin.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required data-testid="auth-email-input" />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required data-testid="auth-password-input" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-emerald-600 h-11" data-testid="auth-submit-button">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
            </Button>
          </form>
          <div className="mt-4 text-sm text-center text-muted-foreground">
            Hesabın yok mu? <Link to="/kayit" className="text-primary font-medium" data-testid="goto-register-link">Kayıt ol</Link>
          </div>
          <div className="mt-4 p-3 bg-[#F7FBF8] rounded-xl text-xs text-muted-foreground">
            <strong>Demo Hesaplar:</strong><br/>
            Admin: admin@yesildukkan.com / Admin1234!<br/>
            Müşteri: demo@yesildukkan.com / Demo1234!
          </div>
        </Card>
      </div>
    </div>
  );
}
