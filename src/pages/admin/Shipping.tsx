import { useState } from 'react';
import { Header } from '../../components/Header';
import { Glass } from '../../components/Glass';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function AdminShipping() {
  const { shipping, setShipping } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const [novaPoshtaPrice, setNovaPoshtaPrice] = useState(String(shipping.novaPoshtaPrice));
  const [freeThreshold, setFreeThreshold] = useState(String(shipping.freeShippingThreshold));

  const save = () => {
    setShipping({
      novaPoshtaPrice: Number(novaPoshtaPrice) || 100,
      freeShippingThreshold: Number(freeThreshold) || 3000,
    });
  };

  if (!isAdmin) {
    return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
      <p>{t('admin.access.denied')}</p>
    </div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.shipping')} onBack={() => window.history.back()} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10 }}>
        <Glass style={{ borderRadius: 'var(--rounded-lg)', padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6, display: 'block' }}>{t('shipping.np_price')}</label>
              <input
                type="number"
                value={novaPoshtaPrice}
                onChange={(e) => setNovaPoshtaPrice(e.target.value)}
                style={{
                  width: '100%', height: 48,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '0 16px',
                  color: '#e0e8f0', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6, display: 'block' }}>{t('shipping.free_threshold')}</label>
              <input
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                style={{
                  width: '100%', height: 48,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '0 16px',
                  color: '#e0e8f0', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <button
              onClick={save}
              style={{
                width: '100%', height: 48, borderRadius: 9999,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('admin.collection.save')}
            </button>
          </div>
        </Glass>
      </main>
    </div>
  );
}
