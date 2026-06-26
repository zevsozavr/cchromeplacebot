import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LangProvider } from './context/LangContext';
import { Storefront } from './pages/Storefront';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmed } from './pages/OrderConfirmed';
import { Settings } from './pages/Settings';
import { Products } from './pages/Products';
import { Favorites } from './pages/Favorites';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminPhotos } from './pages/admin/Photos';
import { AdminCollection } from './pages/admin/Collection';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            <FavoritesProvider>
            <LangProvider>
              <Routes>
                <Route path="/" element={<Storefront />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmed" element={<OrderConfirmed />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />

                <Route path="/admin/photos" element={<AdminPhotos />} />
                <Route path="/admin/collection" element={<AdminCollection />} />
              </Routes>
            </LangProvider>
          </FavoritesProvider>
        </CartProvider>
      </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
