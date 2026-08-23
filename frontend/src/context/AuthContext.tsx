'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { intelligenceApi } from '../services/api';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem('jigyasa_jwt_token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const userData = await intelligenceApi.getMe(savedToken);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem('jigyasa_jwt_token');
            setToken(null);
          }
        } catch {
          localStorage.removeItem('jigyasa_jwt_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await intelligenceApi.loginUser(email, password);
      if (res && res.access_token) {
        setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('jigyasa_jwt_token', res.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    try {
      const res = await intelligenceApi.registerUser(email, password, fullName);
      if (res && res.access_token) {
        setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('jigyasa_jwt_token', res.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jigyasa_jwt_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
