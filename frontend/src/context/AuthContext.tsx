import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../api/client';
import type { ProfilePatch, User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(api.getCurrentUser());

  const login = useCallback(async (email: string, password: string) => {
    setUser(await api.login(email, password));
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setUser(await api.signup(name, email, password));
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    setUser(await api.updateProfile(patch));
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, signup, logout, updateProfile, deleteAccount }),
    [user, login, signup, logout, updateProfile, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
