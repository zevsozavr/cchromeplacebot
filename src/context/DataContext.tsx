import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { Product, Category } from '../types';

const STORAGE_KEY = 'cchrome_data';
const API_BASE = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';

interface StoredData {
  products: Product[];
  npConfig?: Record<string, string>;
}

interface DataContextValue {
  products: Product[];
  addProduct: (p: Product) => Promise<boolean>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  categories: Category[];
  addCategory: (name: string) => void;
  npConfig: StoredData['npConfig'];
  setNpConfig: (c: StoredData['npConfig']) => void;
  dbReady: boolean;
  saving: boolean;
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
  const [saving, setSaving] = useState(false);

  // Refs hold the latest values so we can flush on page-hide without stale closures.
  const productsRef = useRef<Product[]>(products);
  const npConfigRef = useRef<StoredData['npConfig']>(npConfig);
  productsRef.current = products;
  npConfigRef.current = npConfig;

  // Every product id this client is aware of (loaded or created). Sent with each
  // save so the server can preserve products added by another writer meanwhile,
  // while still honoring deletes of products this client knew about.
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Writes the current data to localStorage immediately (synchronous, never lost)
  // and to the server. `keepalive` lets the request finish even if the Telegram
  // webview is closed right after — fixes items vanishing after "create + close".
  const persist = async (data: StoredData, merge = true): Promise<boolean> => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    setSaving(true);
    try {
      const payload = merge ? { ...data, knownIds: Array.from(knownIdsRef.current) } : data;
      const res = await fetch(`${API_BASE}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = () => persist({ products: productsRef.current, npConfig: npConfigRef.current });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/data`);
        if (!res.ok) throw new Error('fail');
        const db = await res.json();
        if (db.products?.length) {
          const cats = [...defaultCategories];
          const names = new Set(cats.map((c) => c.name));
          db.products.forEach((p: Product) => {
            if (p.category && !names.has(p.category)) {
              cats.push({ id: getNextCategoryId(), name: p.category, image: '' });
              names.add(p.category);
            }
          });
          setCategories(cats);
          setProducts(db.products);
          productsRef.current = db.products;
          db.products.forEach((p: Product) => knownIdsRef.current.add(p.id));
        }
        if (db.npConfig) { setNpConfigState(db.npConfig); npConfigRef.current = db.npConfig; }
      } catch {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const local: StoredData = JSON.parse(raw);
            if (local.products?.length) {
              setProducts(local.products);
              productsRef.current = local.products;
              local.products.forEach((p) => knownIdsRef.current.add(p.id));
            }
            if (local.npConfig) { setNpConfigState(local.npConfig); npConfigRef.current = local.npConfig; }
          }
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  // Last-chance flush when the app is being closed/backgrounded (Telegram freezes
  // the webview on close). sendBeacon survives unload; keepalive fetch is a fallback.
  useEffect(() => {
    const flush = () => {
      if (loading) return;
      const body = JSON.stringify({ products: productsRef.current, npConfig: npConfigRef.current, knownIds: Array.from(knownIdsRef.current) });
      try {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon && navigator.sendBeacon(`${API_BASE}/data?beacon=1`, blob)) return;
      } catch {}
      try {
        fetch(`${API_BASE}/data`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
      } catch {}
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loading]);

  const setNpConfig = (c: StoredData['npConfig']) => {
    setNpConfigState(c);
    npConfigRef.current = c;
    save();
  };

  const addProduct = (p: Product): Promise<boolean> => {
    knownIdsRef.current.add(p.id);
    const next = [...productsRef.current, p];
    productsRef.current = next;
    setProducts(next);
    setCategories((prev) => prev.find((c) => c.name === p.category) ? prev : [...prev, { id: getNextCategoryId(), name: p.category, image: '' }]);
    return save();
  };

  const updateProduct = (id: string, p: Partial<Product>): Promise<boolean> => {
    const next = productsRef.current.map((x) => x.id === id ? { ...x, ...p } : x);
    productsRef.current = next;
    setProducts(next);
    return save();
  };

  const deleteProduct = (id: string): Promise<boolean> => {
    const next = productsRef.current.filter((x) => x.id !== id);
    productsRef.current = next;
    setProducts(next);
    return save();
  };

  const addCategory = (name: string) => {
    setCategories((prev) => prev.find((c) => c.name === name) ? prev : [...prev, { id: getNextCategoryId(), name, image: '' }]);
  };

  const clearProducts = () => {
    productsRef.current = [];
    setProducts([]);
    persist({ products: [], npConfig: npConfigRef.current }, false); // full wipe, bypass merge
  };
  const clearAllData = () => {
    productsRef.current = [];
    npConfigRef.current = undefined;
    knownIdsRef.current = new Set();
    setProducts([]);
    setNpConfigState(undefined);
    setCategories(defaultCategories.filter((c) => c.name === 'All'));
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    persist({ products: [], npConfig: undefined }, false); // full wipe, bypass merge
  };

  return (
    <DataContext.Provider value={{
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory,
      npConfig, setNpConfig,
      dbReady: !loading, saving, clearProducts, clearAllData,
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
