import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogRenderer } from '@/components/BlogRenderer';
import { MiniProductCard } from '@/components/MiniProductCard';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { useSEO } from '@/lib/seo';
import { Calendar, User, Eye, BookOpen, MessageCircle, Hash, ArrowLeft } from 'lucide-react';

function Sidebar({ tags, recent, related_products }) {
  return (
    <div className="lg:sticky lg:top-20 space-y-4">
      {related_products && related_products.length > 0 && (
        <Card className="p-5 bg-white" data-testid="blog-sidebar-related-products">
          <h3 className="font-semibold font-heading mb-3">İlgili Bitkiler</h3>
          <div className="space-y-3">
            {related_products.map(p => <MiniProductCard key={p.id} product={p} variant="row" />)}
          </div>
        </Card>
      )}
      {recent.length > 0 && (
        <Card className="p-5 bg-white">
          <h3 className="font-semibold font-heading mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Son Yazılar</h3>
          <ul className="space-y-3">
            {recent.map(p => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`} className="flex gap-2 group">
                  {p.cover_image && <img src={resolveImageUrl(p.cover_image)} className="w-14 h-14 object-cover rounded-xl" alt={p.title} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2 group-hover:text-primary">{p.title}</div>
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
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 15).map(t => (
              <Link key={t.tag} to={`/blog?tag=${t.tag}`} className="text-xs bg-[hsl(var(--secondary))] text-primary px-2.5 py-1 rounded-xl hover:bg-emerald-100">#{t.tag}</Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    Promise.all([
      api.get(`/blog/${slug}`),
      api.get('/blog-recent', { params: { limit: 5 } }),
      api.get('/blog-tags'),
    ]).then(([r1, r2, r3]) => {
      setData(r1.data);
      setRecent(r2.data.items);
      setTags(r3.data.items);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, [slug]);

  const post = data?.post;
  useSEO(post ? {
    title: post.meta_title || `${post.title} - Yeşil Dükkan Blog`,
    description: post.meta_description || post.excerpt,
    canonical: window.location.origin + `/blog/${slug}`,
    ogImage: post.cover_image ? resolveImageUrl(post.cover_image) : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: post.cover_image ? resolveImageUrl(post.cover_image) : undefined,
      author: { '@type': 'Person', name: post.author_name },
      datePublished: post.published_at,
      publisher: { '@type': 'Organization', name: 'Yeşil Dükkan' },
    },
  } : { title: 'Yazı - Yeşil Dükkan' });

  if (loading) return <div className="max-w-3xl mx-auto p-10"><div className="shimmer h-96 rounded-xl" /></div>;
  if (!post) return <div className="max-w-2xl mx-auto p-10 text-center"><Card className="p-10"><p>Yazı bulunamadı.</p></Card></div>;

  return (
    <div data-testid="blog-post-page" className="pb-24 md:pb-10">
      {/* Contained hero */}
      {post.cover_image && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
          <div className="relative bg-[#0F1A12] rounded-xl overflow-hidden shadow-sm">
            <img src={resolveImageUrl(post.cover_image)} alt={post.title} className="w-full h-[30vh] sm:h-[45vh] object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A12] via-[#0F1A12]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-6 sm:px-10 pb-8 text-white">
              <div className="mb-4 text-white/80 [&_a]:text-white/80 hover:[&_a]:text-white [&_nav_span]:text-white">
                <SiteBreadcrumb items={[
                  { label: 'Ana Sayfa', href: '/' },
                  { label: 'Blog', href: '/blog' },
                  { label: post.title }
                ]} />
              </div>
              <h1 className="text-3xl sm:text-5xl font-semibold font-heading text-white max-w-3xl" data-testid="blog-post-title">{post.title}</h1>
              <div className="mt-3 flex items-center gap-4 text-sm text-white/85 flex-wrap">
                <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.author_name}</span>
                {post.published_at && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.view_count} okuma</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!post.cover_image && (
          <div className="mb-6">
            <div className="mb-4">
              <SiteBreadcrumb items={[
                { label: 'Blog', href: '/blog' },
                { label: post.title }
              ]} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold font-heading">{post.title}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.author_name}</span>
              {post.published_at && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.view_count} okuma</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_300px] gap-10 items-start">
          <article>
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {post.tags.map(t => <Badge key={t} variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))]">#{t}</Badge>)}
              </div>
            )}
            {post.excerpt && <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 my-6">{post.excerpt}</p>}
            <div data-testid="blog-post-content">
              <BlogRenderer data={post.content} />
            </div>

            {/* In-article related products (after content) */}
            {data?.related_products?.length > 0 && (
              <section className="mt-10 pt-8 border-t border-[hsl(var(--border))]" data-testid="blog-inline-products">
                <h3 className="text-xl font-semibold font-heading mb-4">Yazıda Bahsedilen Bitkiler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.related_products.map(p => <MiniProductCard key={p.id} product={p} />)}
                </div>
              </section>
            )}

            {/* Related blog posts */}
            {data?.related?.length > 0 && (
              <section className="mt-12 pt-8 border-t border-[hsl(var(--border))]">
                <h3 className="text-xl font-semibold font-heading mb-4">Benzer Yazılar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.related.map(p => (
                    <Link to={`/blog/${p.slug}`} key={p.id}>
                      <Card className="overflow-hidden bg-white hover:shadow-md transition-shadow h-full">
                        {p.cover_image && <div className="aspect-[4/3] overflow-hidden"><img src={resolveImageUrl(p.cover_image)} alt={p.title} className="w-full h-full object-cover" /></div>}
                        <div className="p-4">
                          <h4 className="font-medium font-heading line-clamp-2">{p.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside>
            <Sidebar tags={tags} recent={recent} related_products={data?.related_products} />
          </aside>
        </div>
      </div>
    </div>
  );
}
