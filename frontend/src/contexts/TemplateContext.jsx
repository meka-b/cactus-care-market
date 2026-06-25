import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

const TemplateContext = createContext();

export function TemplateProvider({ children }) {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/settings/templates')
      .then(res => {
        if (alive) {
          setTemplates(res.data || {});
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load templates:", err);
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const updateTemplates = (newTemplates) => {
    setTemplates(prev => ({ ...prev, ...newTemplates }));
  };

  return (
    <TemplateContext.Provider value={{ templates, loading, updateTemplates }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  return useContext(TemplateContext);
}
