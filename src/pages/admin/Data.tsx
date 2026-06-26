import { useState } from 'react';
import { Header } from '../../components/Header';
import { Glass } from '../../components/Glass';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function AdminData() {
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const { products, clearProducts, clearAllData } = useData();
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const deleteAllOrders = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, orders: [] }),
        });
      }
    } catch {}
    localStorage.removeItem('plugstreet_orders');
  };

  const deleteAllProductsAndReset = () => {
    clearAllData();
  };

  if (!isAdmin) {
    return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
      <p>{t('admin.access.denied')}</p>
    </div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.data')} onBack={() => window.history.back()} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10 }}>
        <h2 style={{ font: 'var(--font-headline)', marginBottom: 20 }}>{t('admin.data')}</h2>

        <Glass style={{ borderRadius: 'var(--rounded-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 600, color: '#e0e8f0', fontSize: 14 }}>{t('admin.products')}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{products.length} {t('products.count')}</p>
            </div>
            <button onClick={clearProducts}
              style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: 12, cursor: 'pointer' }}>
              {t('admin.data.clear')} {t('admin.products')}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#e0e8f0', fontSize: 14 }}>{t('admin.orders')}</p>
            </div>
            <button onClick={deleteAllOrders}
              style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: 12, cursor: 'pointer' }}>
              {t('admin.data.clear')} {t('admin.orders')}
            </button>
          </div>
        </Glass>

        <Glass style={{ borderRadius: 'var(--rounded-lg)', padding: 20 }}>
          <p style={{ fontWeight: 600, color: '#ff6b6b', fontSize: 14, marginBottom: 8 }}>{t('admin.data.danger')}</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{t('admin.data.danger.desc')}</p>
          {confirmClearAll ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deleteAllProductsAndReset}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 999, background: '#ff6b6b', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('admin.data.confirm')}
              </button>
              <button onClick={() => setConfirmClearAll(false)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e8f0', fontSize: 13, cursor: 'pointer' }}>
                {t('admin.cancel')}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmClearAll(true)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: 999, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: 13, cursor: 'pointer' }}>
              {t('admin.data.clear_all')}
            </button>
          )}
        </Glass>
      </main>
    </div>
  );
}
