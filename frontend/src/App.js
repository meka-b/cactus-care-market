import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import '@/App.css';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';
import { Layout } from '@/components/Layout';
import { initGA, trackPageView } from '@/lib/analytics';

import HomePage from '@/pages/HomePage';
import CategoryPage from '@/pages/CategoryPage';
import CollectionPage from '@/pages/CollectionPage';
import ProductPage from '@/pages/ProductPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderPage from '@/pages/OrderPage';
import OrderFailPage from '@/pages/OrderFailPage';
import SearchPage from '@/pages/SearchPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AccountPage from '@/pages/AccountPage';
import WishlistPage from '@/pages/WishlistPage';
import BlogListPage from '@/pages/BlogListPage';
import BlogPostPage from '@/pages/BlogPostPage';
import SpeciesPage from '@/pages/SpeciesPage';
import FamilyPage from '@/pages/FamilyPage';
import GenusPage from '@/pages/GenusPage';
import DiseasePage from '@/pages/DiseasePage';
import DiseaseListPage from '@/pages/DiseaseListPage';
import PlantIdPage from '@/pages/PlantIdPage';
import EncyclopediaPage from '@/pages/EncyclopediaPage';
import CollectionListPage from '@/pages/CollectionListPage';

import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminAIAdd from '@/pages/admin/AdminAIAdd';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminCampaigns from '@/pages/admin/AdminCampaigns';
import AdminBlogList from '@/pages/admin/AdminBlogList';
import AdminBlogEditor from '@/pages/admin/AdminBlogEditor';
import AdminProductEdit from '@/pages/admin/AdminProductEdit';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminCategories from '@/pages/admin/AdminCategories';
import { AdminDesigner } from '@/pages/admin/AdminDesigner';
import AdminHeroBanner from '@/pages/admin/AdminHeroBanner';
import AdminRAG from '@/pages/admin/AdminRAG';
import AdminKnowledgeGraph from '@/pages/admin/AdminKnowledgeGraph';
import AdminKGEditor from '@/pages/admin/AdminKGEditor';
import AdminSystemDoctor from '@/pages/admin/AdminSystemDoctor';
import { TemplateProvider } from '@/contexts/TemplateContext';

function GATracker() {
  const location = useLocation();
  useEffect(() => { initGA(); }, []);
  useEffect(() => { trackPageView(location.pathname + location.search); }, [location]);
  return null;
}

const SiteRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout><HomePage /></Layout>} />
    <Route path="/k/:slug" element={<Layout><CategoryPage /></Layout>} />
    <Route path="/koleksiyon" element={<Layout><CollectionListPage /></Layout>} />
    <Route path="/koleksiyon/:species" element={<Layout><CollectionPage /></Layout>} />
    <Route path="/u/:slug" element={<Layout><ProductPage /></Layout>} />
    <Route path="/arama" element={<Layout><SearchPage /></Layout>} />
    <Route path="/sepet" element={<Layout><CheckoutPage /></Layout>} />
    <Route path="/odeme" element={<Layout><CheckoutPage /></Layout>} />
    <Route path="/siparis/:id" element={<Layout><OrderPage /></Layout>} />
    <Route path="/siparis-hata" element={<Layout><OrderFailPage /></Layout>} />
    <Route path="/giris" element={<Layout><LoginPage /></Layout>} />
    <Route path="/kayit" element={<Layout><RegisterPage /></Layout>} />
    <Route path="/hesap" element={<Layout><AccountPage /></Layout>} />
    <Route path="/hesap/siparislerim" element={<Layout><AccountPage /></Layout>} />
    <Route path="/hesap/favorilerim" element={<Layout><WishlistPage /></Layout>} />
    <Route path="/blog" element={<Layout><BlogListPage /></Layout>} />
    <Route path="/blog/:slug" element={<Layout><BlogPostPage /></Layout>} />
    <Route path="/tur/:slug" element={<Layout><SpeciesPage /></Layout>} />
    <Route path="/aile/:slug" element={<Layout><FamilyPage /></Layout>} />
    <Route path="/cins/:slug" element={<Layout><GenusPage /></Layout>} />
    <Route path="/hastaliklar" element={<Layout><DiseaseListPage /></Layout>} />
    <Route path="/hastalik/:slug" element={<Layout><DiseasePage /></Layout>} />
    <Route path="/teshis" element={<Layout><PlantIdPage /></Layout>} />
    <Route path="/bilgi" element={<Layout><EncyclopediaPage /></Layout>} />

    {/* Admin */}
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="urun-ekle" element={<AdminAIAdd />} />
      <Route path="urunler" element={<AdminProducts />} />
      <Route path="urunler/:id" element={<AdminProductEdit />} />
      <Route path="siparisler" element={<AdminOrders />} />
      <Route path="yorumlar" element={<AdminReviews />} />
      <Route path="kuponlar" element={<AdminCoupons />} />
      <Route path="kampanyalar" element={<AdminCampaigns />} />
      <Route path="blog" element={<AdminBlogList />} />
      <Route path="blog/yeni" element={<AdminBlogEditor />} />
      <Route path="blog/:id" element={<AdminBlogEditor />} />
      <Route path="kategoriler" element={<AdminCategories />} />
      <Route path="ayarlar" element={<AdminSettings />} />
      <Route path="tasarim" element={<AdminDesigner />} />
      <Route path="hero" element={<AdminHeroBanner />} />
      <Route path="rag" element={<AdminRAG />} />
      <Route path="knowledge-graph" element={<AdminKnowledgeGraph />} />
      <Route path="knowledge-graph/editor" element={<AdminKGEditor />} />
      <Route path="doktor" element={<AdminSystemDoctor />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <TemplateProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowserRouter>
              <GATracker />
              <SiteRoutes />
            </BrowserRouter>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </TemplateProvider>
  );
}

export default App;
