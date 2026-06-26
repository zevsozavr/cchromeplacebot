import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, CartItem } from '../types';

const CART_STORAGE_KEY = 'plugstreet_cart';

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
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => { saveToStorage(); }, [saveToStorage]);

  useEffect(() => {
    const handle = () => saveToStorage();
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [saveToStorage]);

  const addItem = useCallback((product: Product, selectedSize: string, selectedColor: string) => {
    setItems((prev) => {
      const maxStock = product.sizeStock?.[selectedSize] ?? product.stock ?? 5;
      const existingIdx = prev.findIndex((i) => i.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor);
      
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= maxStock) return prev; // Limit to stock!
        return prev.map((i, idx) => idx === existingIdx ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (maxStock <= 0) return prev; // Cannot add if out of stock
      return [...prev, { ...product, selectedSize, selectedColor, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id + i.selectedSize + i.selectedColor !== id)), []);
  
  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) { setItems((prev) => prev.filter((i) => i.id + i.selectedSize + i.selectedColor !== id)); return; }
    setItems((prev) => prev.map((i) => {
      if (i.id + i.selectedSize + i.selectedColor === id) {
        const maxStock = i.sizeStock?.[i.selectedSize] ?? i.stock ?? 5;
        const newQty = Math.min(qty, maxStock);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
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
