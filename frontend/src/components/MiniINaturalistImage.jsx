import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

export function MiniINaturalistImage({ scientificName }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scientificName) return;

    let isMounted = true;
    setLoading(true);

    const fetchPhoto = async (queryName) => {
      try {
        const url = `https://api.inaturalist.org/v2/observations?taxon_name=${encodeURIComponent(queryName)}&photos=true&per_page=5&quality_grade=research&fields=(photos:(url:!t))`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          for (const obs of data.results) {
            if (obs.photos && obs.photos.length > 0) {
              return obs.photos[0].url.replace('square', 'medium');
            }
          }
        }
        return null;
      } catch (err) {
        return null;
      }
    };

    const runSearch = async () => {
      let currentQuery = scientificName.trim();
      let resultPhoto = null;

      while (currentQuery.split(' ').length > 1) {
        resultPhoto = await fetchPhoto(currentQuery);
        if (resultPhoto) break;
        // Fallback: remove the last word
        const words = currentQuery.split(' ');
        words.pop();
        currentQuery = words.join(' ');
      }

      if (!resultPhoto && currentQuery.split(' ').length === 1) {
        resultPhoto = await fetchPhoto(currentQuery);
      }

      if (isMounted) {
        setPhoto(resultPhoto);
        setLoading(false);
      }
    };

    runSearch();

    return () => { isMounted = false; };
  }, [scientificName]);

  if (loading) return <div className="w-16 h-16 rounded-xl shimmer shrink-0"></div>;
  if (!photo) return (
    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-300">
      <Camera className="w-6 h-6" />
    </div>
  );

  return (
    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
      <img src={photo} alt={scientificName} loading="lazy" className="w-full h-full object-cover" />
    </div>
  );
}
