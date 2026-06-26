import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, Category } from '../types';

const STORAGE_KEY = 'cchrome_data';
const DATA_VERSION = 2;
const VERSION_KEY = 'cchrome_data_v';
const API_BASE = '/api';

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

function loadData(): StoredData | null {
  try {
    if (localStorage.getItem(VERSION_KEY) !== String(DATA_VERSION)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveData(data: StoredData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getNextCategoryId(): string {
  return 'c' + (Date.now());
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const saved = loadData();

  const [products, setProducts] = useState<Product[]>(saved?.products || defaultProducts);
  const [npConfig, setNpConfigState] = useState<StoredData['npConfig']>(saved?.npConfig || undefined);
  const [dbReady, setDbReady] = useState(false);

  const [categories, setCategories] = useState<Category[]>(() => {
    const result = [...defaultCategories];
    const existingNames = new Set(result.map((c) => c.name));
    saved?.products.forEach((p) => {
      if (!existingNames.has(p.category)) {
        result.push({ id: getNextCategoryId(), name: p.category, image: '' });
        existingNames.add(p.category);
      }
    });
    return result;
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/data`);
        if (!res.ok) throw new Error('DB not available');
        const dbData = await res.json();
        if (dbData.products && dbData.products.length > 0) setProducts(dbData.products);
        if (dbData.npConfig) setNpConfigState(dbData.npConfig);
        setDbReady(true);
      } catch {
        setDbReady(false);
        const local = loadData();
        if (local) {
          if (local.products && local.products.length > 0) setProducts(local.products);
          if (local.npConfig) setNpConfigState(local.npConfig);
        }
      }
    })();
  }, []);

  const persist = useCallback(async (data: StoredData) => {
    saveData(data);
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) saveData(data);
    } catch {
      saveData(data);
    }
  }, []);

  useEffect(() => {
    if (dbReady) {
      persist({ products, npConfig });
    } else {
      saveData({ products, npConfig });
    }
  }, [products, npConfig, dbReady, persist]);

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
    if (dbReady) {
      persist({ products: [] });
    }
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
