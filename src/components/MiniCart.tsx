import { useNavigate } from 'react-router-dom';
import { useMiniCart } from '../context/MiniCartContext';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LangContext';

export function MiniCart() {
  const navigate = useNavigate();
  const { isCartOpen, closeCart } = useMiniCart();
  const { items, totalPrice, removeItem, updateQuantity } = useCart();
  const { t } = useLang();

  if (!isCartOpen) return null;

  return (
    <>
      <div
        onClick={closeCart}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
          background: '#0f1524',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '70vh', overflow: 'auto',
          padding: '24px 24px 32px',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e0e8f0' }}>{t('cart.title')} ({items.length})</h3>
          <button onClick={closeCart} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 24 }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {items.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>{t('cart.empty')}</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id + item.selectedSize} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 56, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                  <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 2 }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{t('cart.size')} {item.selectedSize}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#a3a3a3' }}>₴{item.price.toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button
                    onClick={() => removeItem(item.id + item.selectedSize)}
                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 2 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => updateQuantity(item.id + item.selectedSize, item.quantity - 1)}
                      style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e8f0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 13, color: '#e0e8f0', minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id + item.selectedSize, item.quantity + 1)}
                      style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e8f0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#e0e8f0' }}>{t('cart.total')}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#a3a3a3' }}>₴{totalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => { closeCart(); navigate('/cart'); }}
                style={{
                  width: '100%', height: 48, borderRadius: 9999,
                  background: 'linear-gradient(135deg, #a3a3a3, #737373)',
                  border: 'none', color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', marginBottom: 8,
                }}
              >
                {t('cart.view')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

