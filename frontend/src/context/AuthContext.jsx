import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login'); // 'login' | 'signup'

  const openAuthModal = (view = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sf_token');
      if (token) {
        try {
          const userData = await api.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed", error);
          localStorage.removeItem('sf_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('sf_token', data.access_token);
    const userData = await api.getCurrentUser();
    setUser(userData);
    closeAuthModal();
  };

  const signup = async (email, password) => {
    const data = await api.signup(email, password);
    localStorage.setItem('sf_token', data.access_token);
    const userData = await api.getCurrentUser();
    setUser(userData);
    closeAuthModal();
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('sf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading, 
      login, 
      signup, 
      logout,
      isAuthModalOpen,
      authModalView,
      setAuthModalView,
      openAuthModal,
      closeAuthModal
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
