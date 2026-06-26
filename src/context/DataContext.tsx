import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { Product, Category } from '../types';

const STORAGE_KEY = 'cchrome_data';
const API_BASE = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';

interface StoredData {
  products: Product[];
  npConfig?: {
    senderRef: string;
    senderAddressRef: string;
    contactSenderRef: string;
    citySenderRef: string;
    senderPhone: string;
  };
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

const defaultProducts: Product[] = [];

function loadLocal(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(data: StoredData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getNextCategoryId(): string {
  return 'c' + Date.now();
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const localData = loadLocal();

  const [products, setProducts] = useState<Product[]>(localData?.products || defaultProducts);
  const [npConfig, setNpConfigState] = useState<StoredData['npConfig']>(localData?.npConfig || undefined);
  const [dbReady, setDbReady] = useState(false);
  const syncedOnce = useRef(false);

  const [categories, setCategories] = useState<Category[]>(() => {
    const result = [...defaultCategories];
    const names = new Set(result.map((c) => c.name));
    (localData?.products || []).forEach((p) => {
      if (!names.has(p.category)) {
        result.push({ id: getNextCategoryId(), name: p.category, image: '' });
        names.add(p.category);
      }
    });
    return result;
  });

  // Sync from server once on mount — ONLY fills in when localStorage is empty
  useEffect(() => {
    (async () => {
      try {
        const local = loadLocal();
        const res = await fetch(`${API_BASE}/data`);
        if (!res.ok) throw new Error('fail');
        const db = await res.json();
        // Only use server data if localStorage was empty
        if (!local) {
          if (db.products && db.products.length > 0) setProducts(db.products);
          if (db.npConfig) setNpConfigState(db.npConfig);
        }
      } catch {}
      setDbReady(true);
      syncedOnce.current = true;
    })();
  }, []);

  // Persist: save to localStorage + fire-and-forget to server
  useEffect(() => {
    const data: StoredData = { products, npConfig };
    saveLocal(data);
    fetch(`${API_BASE}/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, [products, npConfig]);

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
      dbReady, clearProducts, clearAllData,
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