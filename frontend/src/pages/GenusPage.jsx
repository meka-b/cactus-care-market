import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { ArrowRight, BookOpen, Leaf, ShoppingBag } from 'lucide-react';
import { MiniINaturalistImage } from '@/components/MiniINaturalistImage';
import { ProductCard } from '@/components/ProductCard';

export default function GenusPage() {
  const { slug } = useParams();
  const [genus, setGenus] = useState(null);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/kg/genuses/${slug}`).then(res => {
      setGenus(res.data);
      // Fetch related products and blogs using the genus name
      if (res.data.name) {
        Promise.all([
          api.get('/products', { params: { search: res.data.name, limit: 4 } }),
          api.get('/blog', { params: { search: res.data.name, limit: 4 } })
        ]).then(([prodRes, blogRes]) => {
          setProducts(prodRes.data.items || []);
          setBlogs(blogRes.data.items || []);
        });
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [slug]);

  useSEO({ title: genus ? `${genus.name} Cinsi` : 'Cins' });

  if (!genus) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <SiteBreadcrumb items={[
        { label: 'Ansiklopedi', href: '/bilgi' },
        { label: genus.family_slug, href: `/aile/${genus.family_slug}` },
        { label: genus.name }
      ]} />
      
      <div className="mt-8 flex items-center gap-4 border-b pb-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-2xl shrink-0">
          <Leaf className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900">{genus.name}</h1>
          <p className="text-slate-500 font-medium mt-1">Bitki Cinsi</p>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_350px] gap-10 items-start">
        {/* Left Column: Content */}
        <div className="space-y-12">
          <section className="prose max-w-none text-slate-700 leading-relaxed text-lg">
            <p>{genus.description}</p>
          </section>

          {genus.species && genus.species.length > 0 && (
            <section>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Bu Cinse Ait Türler</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {genus.species.map(species => (
                  <Link key={species.slug} to={`/tur/${species.slug}`} className="group">
                    <Card className="p-3 hover:shadow-md transition-shadow border-slate-200 h-full flex items-center gap-4">
                      <MiniINaturalistImage scientificName={species.scientific_name} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{species.scientific_name}</h3>
                        {species.common_names && species.common_names.length > 0 && (
                          <p className="text-sm text-slate-500 truncate">{species.common_names[0]}</p>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
                Bu Cinsten Satışta Olan Ürünlerimiz
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {blogs.length > 0 && (
            <section>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                Bu Cinse Ait Yazılar
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {blogs.map(b => (
                  <Link key={b.id} to={`/blog/${b.slug}`} className="group flex gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
                    {b.cover_image && <img src={resolveImageUrl(b.cover_image)} className="w-20 h-20 object-cover rounded-lg shrink-0" alt={b.title} />}
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="font-medium text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">{b.title}</h3>
                      {b.published_at && <span className="text-xs text-slate-500 mt-2 block">{new Date(b.published_at).toLocaleDateString('tr-TR')}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-6">
          <Card className="p-6 bg-slate-50/50 border-slate-200 shadow-sm rounded-2xl">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Cins Özeti
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Bilimsel Ad:</span>
                <span>{genus.name}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Bağlı Olduğu Familya:</span>
                <Link to={`/aile/${genus.family_slug}`} className="text-emerald-600 hover:underline capitalize">{genus.family_slug}</Link>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Tür Sayısı:</span>
                <span>{genus.species?.length || 0}</span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
