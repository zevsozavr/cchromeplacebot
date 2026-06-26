import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, Category } from '../types';

const STORAGE_KEY = 'cchrome_data';
const API_BASE = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';

interface StoredData {
  products: Product[];
  npConfig?: Record<string, string>;
}

interface DataContextValue {
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  categories: Category[];
  addCategory: (name: string) => void;
  npConfig: StoredData['npConfig'];
  setNpConfig: (c: StoredData['npConfig']) => void;
  dbReady: boolean;
  clearProducts: () => void;
  clearAllData: () => void;
}

const defaultCategories: Category[] = [
  { id: 'c1', name: 'All', image: '' },
  { id: 'c2', name: 'Outerwear', image: '' },
  { id: 'c3', name: 'Accessories', image: '' },
  { id: 'c4', name: 'Tops', image: '' },
  { id: 'c5', name: 'Bottoms', image: '' },
  { id: 'c6', name: 'Shoes', image: '' },
];

function getNextCategoryId(): string {
  return 'c' + Date.now();
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [npConfig, setNpConfigState] = useState<StoredData['npConfig']>(undefined);
  const [categories, setCategories] = useState<Category[]>([...defaultCategories]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/data`);
        if (!res.ok) throw new Error('fail');
        const db = await res.json();
        setProducts((prev) => {
          if (prev.length > 0) return prev;
          if (db.products?.length) {
            const cats = [...defaultCategories];
            const names = new Set(cats.map((c) => c.name));
            db.products.forEach((p: Product) => {
              if (!names.has(p.category)) {
                cats.push({ id: getNextCategoryId(), name: p.category, image: '' });
                names.add(p.category);
              }
            });
            setCategories(cats);
            return db.products;
          }
          return prev;
        });
        if (db.npConfig) setNpConfigState(db.npConfig);
      } catch {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const local: StoredData = JSON.parse(raw);
            if (local.products?.length) setProducts(local.products);
            if (local.npConfig) setNpConfigState(local.npConfig);
          }
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const data: StoredData = { products, npConfig };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    fetch(`${API_BASE}/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, [products, npConfig, loading]);

  const setNpConfig = (c: StoredData['npConfig']) => setNpConfigState(c);

  const addProduct = (p: Product) => {
    setProducts((prev) => [...prev, p]);
    setCategories((prev) => {
      if (prev.find((c) => c.name === p.category)) return prev;
      return [...prev, { id: getNextCategoryId(), name: p.category, image: '' }];
    });
  };
  const updateProduct = (id: string, p: Partial<Product>) => setProducts((prev) => prev.map((x) => x.id === id ? { ...x, ...p } : x));
  const deleteProduct = (id: string) => setProducts((prev) => prev.filter((x) => x.id !== id));

  const addCategory = (name: string) => {
    setCategories((prev) => {
      if (prev.find((c) => c.name === name)) return prev;
      return [...prev, { id: getNextCategoryId(), name, image: '' }];
    });
  };

  const clearProducts = () => setProducts([]);
  const clearAllData = () => {
    setProducts([]);
    setNpConfigState(undefined);
    setCategories(defaultCategories.filter((c) => c.name === 'All'));
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <DataContext.Provider value={{
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory,
      npConfig, setNpConfig,
      dbReady: !loading, clearProducts, clearAllData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}