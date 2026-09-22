import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiGet('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    logout: () => {
      setAuthToken(null);
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
