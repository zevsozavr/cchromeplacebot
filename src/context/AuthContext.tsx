import { createContext, useContext, type ReactNode } from 'react';

const ADMIN_IDS = [7264276513, 822479618];

interface AuthContextValue {
  userId: number | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({ userId: null, isAdmin: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id ?? null;
  const isAdmin = userId !== null && ADMIN_IDS.includes(userId);

  return <AuthContext.Provider value={{ userId, isAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
