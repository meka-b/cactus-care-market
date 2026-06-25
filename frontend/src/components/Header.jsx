import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTemplates } from '@/contexts/TemplateContext';
import { REGISTRY } from '@/components/templates/TemplateRegistry';

export function Header() {
  const navigate = useNavigate();
  const { count, setOpen } = useCart();
  const { user, logout } = useAuth();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState({ header_links: [], site_name: 'Yeşil Dükkan' });
  const [mobileSearch, setMobileSearch] = useState(false);
  
  const templatesContext = useTemplates() || {};
  const templates = templatesContext.templates || {};

  useEffect(() => {
    api.get('/settings/menu').then(r => setMenu(r.data)).catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) { 
      navigate(`/arama?q=${encodeURIComponent(q.trim())}`); 
      setMobileSearch(false); 
    }
  };

  const activeVariantName = templates?.HeaderNavbar || REGISTRY.HeaderNavbar.default;
  const ActiveTemplate = REGISTRY.HeaderNavbar.variants[activeVariantName] || REGISTRY.HeaderNavbar.variants.Default;

  return (
    <ActiveTemplate
      menu={menu}
      user={user}
      logout={logout}
      cartCount={count}
      setOpenCart={setOpen}
      q={q}
      setQ={setQ}
      onSearch={onSearch}
      mobileSearch={mobileSearch}
      setMobileSearch={setMobileSearch}
      navigate={navigate}
    />
  );
}
