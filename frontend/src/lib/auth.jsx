import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('yd_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('yd_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('yd_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const register = async (email, password, name) => {
    const r = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('yd_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = () => {
    localStorage.removeItem('yd_token');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
