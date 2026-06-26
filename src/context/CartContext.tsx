import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product, CartItem } from '../types';

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, selectedSize: string, selectedColor: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor);
      if (existing) return prev.map((i) => i.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, selectedSize, selectedColor, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id + i.selectedSize + i.selectedColor !== id)), []);
  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) { setItems((prev) => prev.filter((i) => i.id + i.selectedSize + i.selectedColor !== id)); return; }
    setItems((prev) => prev.map((i) => i.id + i.selectedSize + i.selectedColor === id ? { ...i, quantity: qty } : i));
  }, []);
  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
