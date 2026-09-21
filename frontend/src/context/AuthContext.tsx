import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../api/client';
import type { ProfilePatch, User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  /** True until the initial session-restore check (GET /me with any stored
   * token) has settled. ProtectedRoute waits on this so a logged-in user
   * isn't bounced to /login while that check is still in flight. */
  loading: boolean;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  /** Returns the signed-up email — the account isn't logged in yet, it
   * still needs verifying (see verifyEmail). */
  signup: (name: string, email: string, password: string, captchaToken: string) => Promise<string>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCurrentUser().then((restored) => {
      setUser(restored);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string, captchaToken: string) => {
    setUser(await api.login(email, password, captchaToken));
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, captchaToken: string) => {
    return api.signup(name, email, password, captchaToken);
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    setUser(await api.verifyEmail(token));
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await api.resendVerification(email);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Even if revoking the token server-side failed (e.g. offline), the
      // local token is already cleared by api.logout() — reflect that here
      // too rather than leaving the UI stuck showing a logged-in user.
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    setUser(await api.updateProfile(patch));
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, verifyEmail, resendVerification, logout, updateProfile, deleteAccount }),
    [user, loading, login, signup, verifyEmail, resendVerification, logout, updateProfile, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
