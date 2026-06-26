import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, Category, Collection, ShippingConfig } from '../types';

const STORAGE_KEY = 'cchrome_data';
const API_BASE = '/api';

interface StoredData {
  products: Product[];
  collection: Collection;
  shipping?: ShippingConfig;
}

interface DataContextValue {
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  categories: Category[];
  addCategory: (name: string) => void;
  collection: Collection;
  setCollection: (c: Collection) => void;
  shipping: ShippingConfig;
  setShipping: (s: ShippingConfig) => void;
  dbReady: boolean;
  clearProducts: () => void;
  clearAllData: () => void;
}

const defaultCategories: Category[] = [
  { id: 'c1', name: 'All', image: '' },
  { id: 'c2', name: 'Outerwear', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&q=80' },
  { id: 'c3', name: 'Accessories', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80' },
  { id: 'c4', name: 'Tops', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a11?w=400&q=80' },
  { id: 'c5', name: 'Bottoms', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80' },
  { id: 'c6', name: 'Dresses', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80' },
  { id: 'c7', name: 'Premium Outerwear', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80' },
];

const defaultProducts: Product[] = [
  { id: '1', name: 'Glacier Parka', category: 'Premium Outerwear', price: 50000, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', description: 'Engineered for the modern explorer. Aerospace-grade thermal insulation with crystalline-infused outer shell.', condition: 'New', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Arctic Blue', hex: '#22c55e', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80' }, { name: 'Charcoal', hex: '#36454f', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80' }, { name: 'Snow', hex: '#f5f5f5', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80' }], inCollection: true, stock: 5 },
  { id: '2', name: 'Silk Scarf', category: 'Accessories', price: 18000, originalPrice: 26000, image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80', description: 'Handwoven silk scarf with abstract ice-fractal patterns. Ethereal and sophisticated.', condition: 'New', sizes: ['One Size'], colors: [{ name: 'Ivory', hex: '#fffff0', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80' }, { name: 'Silver', hex: '#c0c0c0', image: 'https://images.unsplash.com/photo-1601378327566-5a38d2a0aace?w=400&q=80' }, { name: 'Navy', hex: '#000080', image: 'https://images.unsplash.com/photo-1601378327566-5a38d2a0aace?w=400&q=80' }], inCollection: true, stock: 5 },
  { id: '3', name: 'Structured Linen Blazer', category: 'Outerwear', price: 35600, image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&q=80', description: 'Tailored linen blazer with a structured silhouette. Perfect for elevated casual.', condition: 'New', sizes: ['XS', 'S', 'M', 'L'], colors: [{ name: 'Oatmeal', hex: '#f5f0e1' }, { name: 'Black', hex: '#1a1a1a' }], stock: 5 },
  { id: '4', name: 'Signature Leather Tote', category: 'Accessories', price: 48000, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80', description: 'Italian full-grain leather tote with gold-toned hardware. A timeless investment.', condition: 'New', sizes: ['One Size'], colors: [{ name: 'Cognac', hex: '#d2b48c' }, { name: 'Black', hex: '#1a1a1a' }], stock: 5 },
  { id: '5', name: 'Merino Wool Turtleneck', category: 'Tops', price: 15200, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a11?w=400&q=80', description: 'Ultra-fine Merino wool turtleneck. Ribbed cuffs and hem for a refined finish.', condition: 'New', sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: [{ name: 'Cream', hex: '#fffdd0', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a11?w=400&q=80' }, { name: 'Black', hex: '#1a1a1a', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80' }, { name: 'Burgundy', hex: '#800020', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80' }], stock: 5 },
  { id: '6', name: 'Pleated Midi Skirt', category: 'Bottoms', price: 18000, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80', description: 'Elegant pleated midi skirt in lightweight crepe. Moves beautifully with every step.', condition: 'New', sizes: ['XS', 'S', 'M', 'L'], colors: [{ name: 'Forest', hex: '#228b22' }, { name: 'Navy', hex: '#000080' }, { name: 'Black', hex: '#1a1a1a' }], stock: 5 },
  { id: '7', name: 'Cashmere Blend Coat', category: 'Outerwear', price: 72000, originalPrice: 96000, image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&q=80', description: 'Luxurious cashmere blend coat with a tailored fit. Investment dressing at its finest.', condition: 'New', sizes: ['S', 'M', 'L'], colors: [{ name: 'Camel', hex: '#c19a6b' }, { name: 'Charcoal', hex: '#36454f' }], inCollection: true, stock: 5 },
  { id: '8', name: 'Silk Evening Gown', category: 'Dresses', price: 88000, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80', description: 'Exquisite silk evening gown with a flowing silhouette. Timeless elegance.', condition: 'New', sizes: ['XS', 'S', 'M', 'L'], colors: [{ name: 'Ivory', hex: '#fffff0' }, { name: 'Black', hex: '#1a1a1a' }, { name: 'Burgundy', hex: '#800020' }], stock: 5 },
];

const defaultCollection: Collection = {
  enabled: true,
  image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  title: 'WINTER DROP',
  subtitle: 'Нова колекція',
  tag: 'Магазин',
};

const defaultShipping: ShippingConfig = {
  novaPoshtaPrice: 100,
  freeShippingThreshold: 3000,
};

function loadData(): StoredData | null {
  try {
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
  const [dbReady, setDbReady] = useState(false);
  const saved = !dbReady ? loadData() : null;

  const [products, setProducts] = useState<Product[]>(saved?.products || defaultProducts);
  const [collection, setCollectionState] = useState<Collection>(saved?.collection || defaultCollection);
  const [shipping, setShippingState] = useState<ShippingConfig>(saved?.shipping || defaultShipping);

  const [categories, setCategories] = useState<Category[]>(() => {
    const existingNames = new Set(saved?.products.map((p) => p.category) || defaultProducts.map((p) => p.category));
    const extra = defaultCategories.filter((c) => c.name === 'All' || existingNames.has(c.name));
    saved?.products.forEach((p) => {
      if (!extra.find((c) => c.name === p.category)) {
        extra.push({ id: getNextCategoryId(), name: p.category, image: '' });
      }
    });
    return extra.length > 1 ? extra : defaultCategories;
  });

  // Load from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/data`);
        if (!res.ok) throw new Error('DB not available');
        const dbData = await res.json();
        if (dbData.products) setProducts(dbData.products);
        if (dbData.collection) setCollectionState(dbData.collection);
        if (dbData.shipping) setShippingState(dbData.shipping);
        setDbReady(true);
      } catch {
        setDbReady(false);
        const local = loadData();
        if (local) {
          if (local.products) setProducts(local.products);
          if (local.collection) setCollectionState(local.collection);
          if (local.shipping) setShippingState(local.shipping);
        }
      }
    })();
  }, []);

  // Persist to DB or localStorage on changes
  const persist = useCallback(async (data: StoredData) => {
    try {
      await fetch(`${API_BASE}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      saveData(data);
    }
  }, []);

  useEffect(() => {
    if (dbReady) {
      persist({ products, collection, shipping });
    } else {
      saveData({ products, collection, shipping });
    }
  }, [products, collection, shipping, dbReady, persist]);

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

  const setCollection = (c: Collection) => setCollectionState(c);
  const setShipping = (s: ShippingConfig) => setShippingState(s);

  const clearProducts = () => setProducts([]);
  const clearAllData = () => {
    setProducts([]);
    setCollectionState(defaultCollection);
    setShippingState(defaultShipping);
    setCategories(defaultCategories.filter((c) => c.name === 'All'));
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    if (dbReady) {
      persist({ products: [], collection: defaultCollection, shipping: defaultShipping });
    }
  };

  return (
    <DataContext.Provider value={{
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory,
      collection, setCollection,
      shipping, setShipping,
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
