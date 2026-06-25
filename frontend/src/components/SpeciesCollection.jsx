import React from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';

const SPECIES = [
  'Mammillaria', 'Astrophytum', 'Echinocereus', 'Echinocactus',
  'Ferocactus', 'Gymnocalycium', 'Opuntia', 'Cereus',
  'Echinopsis', 'Parodia', 'Rebutia', 'Lophophora',
  'Schlumbergera', 'Rhipsalis', 'Carnegiea', 'Copiapoa',
  'Melocactus', 'Notocactus', 'Ariocarpus', 'Stenocactus'
];

export function SpeciesCollection() {
  const [emblaRef] = useEmblaCarousel(
    { dragFree: true, loop: true },
    [AutoScroll({ playOnInit: true, stopOnInteraction: false, stopOnMouseEnter: true, speed: 1 })]
  );

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-[hsl(var(--border))]" data-testid="species-collection">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold font-heading mb-2">Türler</h2>
          <p className="text-muted-foreground">Koleksiyonluk bitki türlerini keşfedin</p>
        </div>
        
        <div className="overflow-hidden cursor-grab active:cursor-grabbing pb-4 -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
          <div className="flex gap-3 sm:gap-4">
            {SPECIES.map(species => (
              <Link 
                key={species}
                to={`/koleksiyon/${species}`}
                className="group flex items-center gap-3 p-1.5 pr-5 bg-[#F7FBF8] border border-[hsl(var(--border))] rounded-full hover:border-primary hover:shadow-sm transition-all flex-none"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 bg-white shadow-sm border border-[hsl(var(--border))]">
                  <img 
                    src={`https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=100&h=100&fit=crop&q=80`} 
                    alt={species} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="font-medium text-sm text-slate-700 group-hover:text-primary transition-colors whitespace-nowrap">
                  {species}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
