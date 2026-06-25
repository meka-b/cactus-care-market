import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useHeroContent(variantName) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHero() {
      try {
        const { data } = await api.get('/settings/hero');
        if (data?.variantFields && data.variantFields[variantName]) {
          setContent(data.variantFields[variantName]);
        } else {
          setContent(null);
        }
      } catch (err) {
        console.error('Hero content fetch error:', err);
        setContent(null);
      } finally {
        setLoading(false);
      }
    }
    fetchHero();
  }, [variantName]);

  return { content, loading };
}
