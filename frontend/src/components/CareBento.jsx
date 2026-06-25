import React from 'react';
import { Sun, Droplets, Sparkles, Ruler, PawPrint, Circle } from 'lucide-react';

export function CareBento({ product }) {
  const cards = [
    { key: 'light', icon: Sun, label: 'Işık', value: product.light_need },
    { key: 'water', icon: Droplets, label: 'Sulama', value: product.water_need },
    { key: 'care', icon: Sparkles, label: 'Bakım', value: product.care_level },
    { key: 'size', icon: Ruler, label: 'Boyut', value: product.size },
    { key: 'pet', icon: PawPrint, label: 'Pet Safe', value: product.pet_safe ? 'Evet' : 'Hayır' },
  ];
  if (product.pot_size) cards.push({ key: 'pot', icon: Circle, label: 'Saksı Çapı', value: product.pot_size });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="product-care-bento">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.key} className="bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-4 h-4 text-primary" /> {c.label}</div>
            <div className="mt-1 font-semibold text-foreground text-sm">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}
