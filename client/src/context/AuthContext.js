import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Initializing auth check');
    const token = localStorage.getItem('token');
    console.log('[AuthContext] Found token in localStorage:', token ? 'Yes' : 'No');
    
    if (token) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('[AuthContext] Verifying existing token');
      axios.get('/api/auth/me')
        .then(res => {
          console.log('[AuthContext] Token verification successful, user:', res.data.user);
          setUser(res.data.user);
        })
        .catch((err) => {
          console.error('[AuthContext] Token verification failed:', err);
          console.log('[AuthContext] Removing invalid token from storage');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          console.log('[AuthContext] Finished auth check');
          setLoading(false);
        });
    } else {
      console.log('[AuthContext] No token found, skipping verification');
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    console.log('[AuthContext] Attempting login with:', { username });
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      console.log('[AuthContext] Login successful, response:', res.data);
      
      const token = res.data.token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(res.data.user);
    } catch (err) {
      console.error('[AuthContext] Login failed:', err);
      throw err;
    }
  };

  const register = async (username, password) => {
    console.log('[AuthContext] Attempting registration with:', { username });
    try {
      const res = await axios.post('/api/auth/register', { 
        username,  
        password 
      });
      console.log('[AuthContext] Registration successful, response:', res.data);
      
      const token = res.data.token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      console.error('[AuthContext] Registration failed:', err);
      console.log('[AuthContext] Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      throw err;
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logging out user:', user?.username);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}