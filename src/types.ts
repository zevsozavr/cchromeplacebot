export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  condition: string;
  sizes: string[];
  colors: { name: string; hex: string; image?: string }[];
  inCollection?: boolean;
  collections?: string[];
  stock?: number;
}

export interface CartItem extends Product {
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Collection {
  enabled: boolean;
  image: string;
  title: string;
  subtitle: string;
  tag: string;
}

export interface ShippingConfig {
  novaPoshtaPrice: number;
  freeShippingThreshold: number;
}

export interface Order {
  id: string;
  items: { name: string; price: number; quantity: number; selectedSize: string; selectedColor: string }[];
  total: number;
  shipping: number;
  date: string;
  name: string;
  phone: string;
  address: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered';
}
