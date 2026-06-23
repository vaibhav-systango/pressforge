'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookies';
import { AUTH } from '@/constants';
import { ROUTES } from '@/routes';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = getCookie(AUTH.SESSION_COOKIE_KEY);
    if (session) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(session));
      } catch (e) {
        console.error('Failed to parse auth session cookie', e);
        deleteCookie(AUTH.SESSION_COOKIE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: UserRole) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockUser: User = {
      id: Math.random().toString(36).substring(7),
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
    };
    setCookie(AUTH.SESSION_COOKIE_KEY, JSON.stringify(mockUser), 7);
    setUser(mockUser);
    setIsLoading(false);
    router.push(ROUTES.DASHBOARD);
  };

  const signup = async (name: string, email: string, role: UserRole) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockUser: User = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      role,
    };
    setCookie(AUTH.SESSION_COOKIE_KEY, JSON.stringify(mockUser), 7);
    setUser(mockUser);
    setIsLoading(false);
    router.push(ROUTES.DASHBOARD);
  };

  const logout = () => {
    deleteCookie(AUTH.SESSION_COOKIE_KEY);
    setUser(null);
    router.push(ROUTES.LOGIN);
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
