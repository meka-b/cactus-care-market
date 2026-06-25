import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

export function INaturalistGallery({ scientificName }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!scientificName) return;

    let isMounted = true;
    setLoading(true);

    const fetchPhotos = async (queryName) => {
      try {
        const url = `https://api.inaturalist.org/v2/observations?taxon_name=${encodeURIComponent(queryName)}&photos=true&per_page=10&quality_grade=research&fields=(photos:(url:!t,attribution:!t))`;
        const res = await fetch(url);
        const data = await res.json();
        
        const extractedPhotos = [];
        if (data.results && data.results.length > 0) {
          data.results.forEach(obs => {
            if (obs.photos && obs.photos.length > 0 && extractedPhotos.length < 4) {
              const photo = obs.photos[0];
              const mediumUrl = photo.url.replace('square', 'medium');
              extractedPhotos.push({
                url: mediumUrl,
                attribution: photo.attribution
              });
            }
          });
          return extractedPhotos;
        }
        return [];
      } catch (err) {
        console.error("iNaturalist error:", err);
        return [];
      }
    };

    const runSearch = async () => {
      let currentQuery = scientificName.trim();
      let resultPhotos = [];

      while (currentQuery.split(' ').length > 1) {
        resultPhotos = await fetchPhotos(currentQuery);
        if (resultPhotos.length > 0) {
          break; // Found photos!
        }
        // Fallback: remove the last word
        const words = currentQuery.split(' ');
        words.pop();
        currentQuery = words.join(' ');
      }

      // Try genus only if not found yet
      if (resultPhotos.length === 0 && currentQuery.split(' ').length === 1) {
        resultPhotos = await fetchPhotos(currentQuery);
      }

      if (isMounted) {
        setPhotos(resultPhotos);
        setLoading(false);
      }
    };

    runSearch();

    return () => { isMounted = false; };
  }, [scientificName]);

  if (loading) return <div className="h-48 shimmer rounded-2xl w-full my-8"></div>;
  if (photos.length === 0) return null;

  return (
    <div className="my-12 border-t pt-8">
      <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Camera className="w-6 h-6 text-emerald-600" />
        Doğal Ortam Görselleri
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedPhoto(p)}
            className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50 cursor-pointer"
          >
            <img 
              src={p.url} 
              alt={`${scientificName} doğal ortam görseli ${i+1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <p className="text-white text-[10px] p-3 leading-tight opacity-90">
                {p.attribution}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button 
              className="absolute -top-10 right-0 text-white hover:text-slate-300 text-sm font-medium tracking-wider"
              onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
            >
              KAPAT ✕
            </button>
            <img 
              src={selectedPhoto.url.replace('medium', 'large')} 
              alt={`${scientificName} büyük boy görsel`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white/70 text-xs mt-4 text-center">
              {selectedPhoto.attribution}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
