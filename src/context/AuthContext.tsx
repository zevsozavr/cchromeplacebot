import { createContext, useContext, useEffect, type ReactNode } from 'react';

const ADMIN_IDS = [7264276513, 822479618];

interface AuthContextValue {
  userId: number | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({ userId: null, isAdmin: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id ?? null;
  const isAdmin = userId !== null && ADMIN_IDS.includes(userId);

  // Auto-register user on mount
  useEffect(() => {
    if (user) {
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: (user as any).language_code,
        }),
      }).catch(() => {});
    }
  }, []);

  return <AuthContext.Provider value={{ userId, isAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
