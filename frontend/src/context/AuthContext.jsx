import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api/client';
import { setAccessToken, clearAccessToken, setRefreshToken, clearRefreshToken } from '../api/client';

const AuthContext = createContext(null);
let bootstrapAuthPromise = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const bootstrapAuth = async () => {
      if (!bootstrapAuthPromise) {
        bootstrapAuthPromise = (async () => {
          const { data } = await auth.refreshToken();
          setAccessToken(data.data.accessToken);
          const userData = await auth.getCurrentUser();
          return userData.data.data;
        })().finally(() => {
          bootstrapAuthPromise = null;
        });
      }

      return bootstrapAuthPromise;
    };

    const checkAuth = async () => {
      try {
        const userData = await bootstrapAuth();
        if (!isActive) return;
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // No valid refresh token - user needs to log in
        if (!isActive) return;
        clearAccessToken();
        clearRefreshToken();
        setUser(null);
        setIsAuthenticated(false);
      }
      if (!isActive) return;
      setLoading(false);
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await auth.login({ email, password });
      setAccessToken(data.data.accessToken);
      if (data.data.refreshToken) setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Login failed',
      };
    }
  };

  const register = async (registerData) => {
    try {
      const { data } = await auth.register(registerData);
      setAccessToken(data.data.accessToken);
      if (data.data.refreshToken) setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAccessToken();
      clearRefreshToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
