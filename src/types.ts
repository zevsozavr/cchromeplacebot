export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  condition: string;
  sizes: string[];
  inCollection?: boolean;
  stock?: number;
  sizeStock?: Record<string, number>;
}

export interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Collection {
  npConfig?: {
    senderRef: string;
    senderAddressRef: string;
    contactSenderRef: string;
    citySenderRef: string;
    senderPhone: string;
  };
}

export interface Order {
  id: string;
  items: { name: string; price: number; quantity: number; selectedSize: string }[];
  total: number;
  shipping: number;
  date: string;
  name: string;
  phone: string;
  address: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered';
  ttn?: string;
  prepay?: boolean;
  npCity?: string;
  npWarehouse?: string;
}
