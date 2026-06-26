import { createContext, useContext, useState, type ReactNode } from 'react';

interface MiniCartContextValue {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const MiniCartContext = createContext<MiniCartContextValue | null>(null);

export function MiniCartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return <MiniCartContext.Provider value={{ isCartOpen, openCart, closeCart }}>{children}</MiniCartContext.Provider>;
}

export function useMiniCart() {
  const ctx = useContext(MiniCartContext);
  if (!ctx) throw new Error('useMiniCart must be used within MiniCartProvider');
  return ctx;
}
