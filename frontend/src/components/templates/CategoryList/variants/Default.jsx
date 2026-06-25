import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function CategoryListDefault({ categories }) {
  return (
    <section className="py-12 sm:py-16" data-testid="home-category-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold font-heading">Kategoriler</h2>
            <p className="text-muted-foreground mt-1">İhtiyacına uygun bitkiyi hızlıca keşfet</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {categories.map(t => {
            const Icon = t.icon;
            return (
              <Link to={`/k/${t.slug}`} key={t.slug} data-testid={`home-category-${t.slug}`}>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
                  <Card className="p-5 sm:p-6 bg-white border-[hsl(var(--border))] hover:border-primary/40 hover:shadow-md transition-shadow rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] text-primary grid place-items-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium font-heading">{t.label}</div>
                        <div className="text-xs text-muted-foreground">Keşfet →</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
