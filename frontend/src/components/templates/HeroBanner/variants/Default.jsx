import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useHeroContent } from '@/hooks/useHeroContent';

export default function HeroBannerDefault() {
  const { content, loading } = useHeroContent('Default');

  useEffect(() => {
    if (content?.seoTitle) {
      document.title = content.seoTitle;
    }
    if (content?.seoDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = content.seoDescription;
    }
  }, [content]);

  if (loading) return <div className="h-96 flex items-center justify-center">Yükleniyor...</div>;

  const title = content?.mainTitle || "Kaktüs ve Salon Bitkilerinde Ferah Seçkiler";
  const subtitle = content?.subtitle || "Eviniz ve ofisiniz için bakımı kolay, pet-friendly, mini boyutlardan dev türlere kadar binlerce bitki.";
  const primaryCta = content?.primaryCtaLabel || "Ürünleri Keşfet";
  const secondaryCta = content?.secondaryCtaLabel || "Kolay Bakım Seçkisi";
  const imgUrl = content?.mainImagePrompt || "https://images.unsplash.com/photo-1591810180805-d7bc7804ebfe?w=900&q=80";

  return (
    <section className="hero-mist relative" data-testid="home-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full mb-4">
                <Sparkles className="w-3 h-3 mr-1" />AI destekli bitki keşif
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground font-heading">
                {title.split(' ').slice(0, -2).join(' ')}<br />
                <span className="text-primary">{title.split(' ').slice(-2).join(' ')}</span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                {subtitle}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={content?.primaryCtaLink || "/k/kaktusler"}>
                  <Button size="lg" className="bg-primary text-white hover:bg-emerald-600 h-11" data-testid="home-hero-primary-cta">
                    {primaryCta} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to={content?.secondaryCtaLink || "/k/kolay-bakim-bitkileri"}>
                  <Button size="lg" variant="outline" className="h-11" data-testid="home-hero-secondary-cta">
                    {secondaryCta}
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div><span className="text-primary font-semibold">100+</span> Bitki Çeşidi</div>
                <div><span className="text-primary font-semibold">24h</span> Kargo</div>
                <div><span className="text-primary font-semibold">AI</span> Bitki Tanı</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative">
              {content?.mainLink ? (
                <Link to={content.mainLink} title={content?.mainAlt || "Hero Görsel"}>
                  <img src={imgUrl.startsWith('http') ? imgUrl : `https://source.unsplash.com/900x900/?${encodeURIComponent(imgUrl)}`} alt={content?.mainAlt || "Hero Görsel"} className="rounded-xl shadow-lg w-full aspect-square object-cover hover:opacity-90 transition-opacity" />
                </Link>
              ) : (
                <img src={imgUrl.startsWith('http') ? imgUrl : `https://source.unsplash.com/900x900/?${encodeURIComponent(imgUrl)}`} alt={content?.mainAlt || "Hero Görsel"} className="rounded-xl shadow-lg w-full aspect-square object-cover" />
              )}
            </motion.div>
          </div>
        </div>
      </section>
  );
}
