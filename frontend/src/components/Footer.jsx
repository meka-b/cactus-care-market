import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[hsl(var(--border))] bg-[#F7FBF8]" data-testid="site-footer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white grid place-items-center"><Leaf className="w-4 h-4" /></div>
              <span className="font-semibold font-heading">Yeşil Dükkan</span>
            </div>
            <p className="text-sm text-muted-foreground">Kaktüs ve salon bitkilerinde AI destekli akıllı keşif.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-heading">Kategoriler</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/k/kaktusler" className="hover:text-primary">Kaktüsler</Link></li>
              <li><Link to="/k/sukulentler" className="hover:text-primary">Sukulentler</Link></li>
              <li><Link to="/k/ic-mekan-bitkileri" className="hover:text-primary">İç Mekan</Link></li>
              <li><Link to="/k/pet-friendly-bitkiler" className="hover:text-primary">Pet Friendly</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-heading">Bakım</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/k/kolay-bakim-bitkileri" className="hover:text-primary">Kolay Bakım</Link></li>
              <li><Link to="/k/az-sulanan-bitkiler" className="hover:text-primary">Az Sulanan</Link></li>
              <li><Link to="/k/tam-gunes-seven-bitkiler" className="hover:text-primary">Tam Güneş</Link></li>
              <li><Link to="/k/mini-bitkiler" className="hover:text-primary">Mini Bitkiler</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-heading">Hesap</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/giris" className="hover:text-primary">Giriş Yap</Link></li>
              <li><Link to="/kayit" className="hover:text-primary">Kayıt Ol</Link></li>
              <li><Link to="/hesap/siparislerim" className="hover:text-primary">Siparişlerim</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[hsl(var(--border))] text-sm text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} Yeşil Dükkan. Tüm hakları saklıdır.</p>
          <p>AI destekli (PlantNet + Mistral) bitki keşif platformu</p>
        </div>
      </div>
    </footer>
  );
}
