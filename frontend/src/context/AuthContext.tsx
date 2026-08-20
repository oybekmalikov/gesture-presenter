import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  isAdmin: boolean;
  isHeadDepartment: boolean;
  isUser: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('okmk_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('okmk_access_token'),
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('okmk_access_token');
      if (storedToken) {
        try {
          const profile = await authApi.me();
          setUser(profile);
          localStorage.setItem('okmk_user', JSON.stringify(profile));
        } catch {
          // Token expired / invalid
          authApi.logout();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const data = await authApi.login(username, password);
    localStorage.setItem('okmk_access_token', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('okmk_refresh_token', data.refreshToken);
    }

    let profile = data.user;
    if (!profile) {
      profile = await authApi.me();
    }
    localStorage.setItem('okmk_user', JSON.stringify(profile));
    setUser(profile);
    setToken(data.accessToken);
    return profile;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const profile = await authApi.me();
      setUser(profile);
      localStorage.setItem('okmk_user', JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  };

  const isAuthenticated = !!user && !!token;
  const isSuperadmin = user?.role === Role.SUPERADMIN;
  const isAdmin = user?.role === Role.ADMIN;
  const isHeadDepartment = user?.role === Role.HEAD_DEPARTMENT;
  const isUser = user?.role === Role.USER;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isSuperadmin,
        isAdmin,
        isHeadDepartment,
        isUser,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
