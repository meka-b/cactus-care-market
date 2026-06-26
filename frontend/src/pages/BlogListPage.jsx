import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { BookOpen, Calendar, MessageCircle, Hash } from 'lucide-react';

function Sidebar({ tags, recent }) {
  return (
    <div className="lg:sticky lg:top-20 space-y-4">
      {recent.length > 0 && (
        <Card className="p-5 bg-white">
          <h3 className="font-semibold font-heading mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Son Yazılar</h3>
          <ul className="space-y-3" data-testid="blog-sidebar-recent">
            {recent.map(p => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`} className="flex gap-2 group">
                  {p.cover_image && <img src={resolveImageUrl(p.cover_image)} className="w-14 h-14 object-cover rounded-xl" alt={p.title} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2 group-hover:text-primary">{p.title}</div>
                    {p.published_at && <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(p.published_at).toLocaleDateString('tr-TR')}</div>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {tags.length > 0 && (
        <Card className="p-5 bg-white">
          <h3 className="font-semibold font-heading mb-3 flex items-center gap-2"><Hash className="w-4 h-4 text-primary" />Kategoriler</h3>
          <div className="flex flex-wrap gap-2" data-testid="blog-sidebar-tags">
            {tags.map(t => (
              <Link key={t.tag} to={`/blog?tag=${t.tag}`} className="text-xs bg-[hsl(var(--secondary))] text-primary px-2.5 py-1 rounded-xl hover:bg-emerald-100">#{t.tag} <span className="text-muted-foreground">({t.count})</span></Link>
            ))}
          </div>
        </Card>
      )}
      <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center"><MessageCircle className="w-4 h-4" /></div>
          <div>
            <div className="font-semibold font-heading">Yaver'e Sor</div>
            <div className="text-xs text-muted-foreground">AI bitki asistanı</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Bitki bakımı, sipariş veya site içeriği hakkında sorularını sol alttaki "Yaver" chatbotuna sorabilirsin.</p>
      </Card>
    </div>
  );
}

export default function BlogListPage() {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Bitki Bakım Rehberi - Yeşil Dükkan Blog',
    description: 'Bitki bakımı, kaktüs türleri, salon bitkileri hakkında uzman rehberleri.',
    canonical: window.location.origin + '/blog',
  });

  useEffect(() => {
    Promise.all([
      api.get('/blog'),
      api.get('/blog-recent', { params: { limit: 5 } }),
      api.get('/blog-tags'),
      api.get('/taxonomy')
    ]).then(([r1, r2, r3, r4]) => {
      setItems(r1.data.items);
      setRecent(r2.data.items);
      setTags(r3.data.items);
      setCategories(r4.data.blog_categories || []);
    }).finally(() => setLoading(false));
  }, []);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10" data-testid="blog-list-page">
      <div className="mb-6">
        <SiteBreadcrumb items={[
          { label: 'Blog', href: '/blog' }
        ]} />
      </div>
      <div className="mt-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold font-heading">Bitki Bakım Rehberi</h1>
        <p className="text-muted-foreground mt-2">Bitkilerinize en iyi bakımı sunmanız için uzman rehberleri.</p>
      </div>

      {/* Blog Categories Carousel */}
      {categories && categories.length > 0 && (
        <div 
          className="flex gap-3 overflow-x-auto no-scrollbar overflow-hidden cursor-grab active:cursor-grabbing pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6"
          onMouseDown={(e) => {
            const ele = e.currentTarget;
            ele.isDown = true;
            ele.startX = e.pageX - ele.offsetLeft;
            ele.scrollLeftStart = ele.scrollLeft;
          }}
          onMouseLeave={(e) => { e.currentTarget.isDown = false; }}
          onMouseUp={(e) => { e.currentTarget.isDown = false; }}
          onMouseMove={(e) => {
            const ele = e.currentTarget;
            if (!ele.isDown) return;
            e.preventDefault();
            const x = e.pageX - ele.offsetLeft;
            const walk = (x - ele.startX) * 2;
            ele.scrollLeft = ele.scrollLeftStart - walk;
          }}
        >
          {categories.map(c => (
            <Link 
              key={c.slug} 
              to={`/blog?category=${c.slug}`}
              className="flex-shrink-0 bg-white border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 px-5 py-2.5 rounded-full text-sm font-medium text-gray-700 hover:text-emerald-700 transition-all shadow-sm"
              draggable="false"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1,2,3].map(i => <div key={i} className="aspect-[4/3] shimmer rounded-xl" />)}</div>
          ) : items.length === 0 ? (
            <Card className="p-10 text-center bg-white">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Henüz yayınlanmış blog yazısı yok.</p>
            </Card>
          ) : (
            <>
              {/* Featured hero */}
              {featured && (
                <Link to={`/blog/${featured.slug}`} data-testid={`blog-featured-${featured.slug}`}>
                  <Card className="overflow-hidden bg-white hover:shadow-md transition-shadow mb-6 group">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-[4/3] md:aspect-auto bg-[#F7FBF8] overflow-hidden">
                        {featured.cover_image ? (
                          <img src={resolveImageUrl(featured.cover_image)} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground"><BookOpen className="w-12 h-12" /></div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-1 text-xs text-primary font-medium mb-2"><Calendar className="w-3 h-3" />{featured.published_at ? new Date(featured.published_at).toLocaleDateString('tr-TR') : ''}</div>
                        <h2 className="text-2xl font-semibold font-heading line-clamp-3">{featured.title}</h2>
                        <p className="text-muted-foreground mt-3 line-clamp-3">{featured.excerpt}</p>
                        <span className="text-primary font-medium mt-4 inline-flex items-center gap-1">Devamını Oku →</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
              {/* Rest grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rest.map(p => (
                    <Link to={`/blog/${p.slug}`} key={p.id} data-testid={`blog-card-${p.slug}`}>
                      <Card className="overflow-hidden bg-white hover:shadow-md transition-shadow group h-full">
                        <div className="aspect-[16/10] bg-[#F7FBF8] overflow-hidden">
                          {p.cover_image ? (
                            <img src={resolveImageUrl(p.cover_image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-muted-foreground"><BookOpen className="w-10 h-10" /></div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="w-3 h-3" />
                            {p.published_at ? new Date(p.published_at).toLocaleDateString('tr-TR') : ''}
                          </div>
                          <h2 className="font-semibold font-heading text-lg line-clamp-2">{p.title}</h2>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <Sidebar tags={tags} recent={recent} />
      </div>
    </div>
  );
}
