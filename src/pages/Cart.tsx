import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { BottomBar } from '../components/BottomBar'

export function Cart() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, totalPrice } = useCart()
  const { t } = useLang()
  const subtotal = totalPrice

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 196 }}>
      {/* Top App Bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 50,
          background: 'rgba(15, 21, 36, 0.4)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          height: 64,
        }}
      >
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#22c55e', display: 'flex' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', color: '#e0e8f0', fontWeight: 600, fontSize: 18 }}>
          {t('cart.bag')} ({items.length} {items.length === 1 ? t('cart.item.label') : t('cart.items.label')})
        </h1>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#22c55e', display: 'flex' }}>
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      {/* Glow Background Element */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      <main style={{ paddingTop: 80, paddingLeft: 16, paddingRight: 16 }}>
        {/* Cart Items */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#a0b4c4', marginBottom: 16, display: 'block' }}>shopping_bag</span>
              <p style={{ color: '#a0b4c4', fontSize: 16, marginBottom: 24 }}>{t('cart.empty.text')}</p>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 32px',
                  background: '#22c55e',
                  color: '#001f2e',
                  border: 'none',
                  borderRadius: 9999,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('cart.continue')}
              </button>
            </div>
          ) : items.map((item) => (
            <div
              key={item.id + item.selectedSize}
              style={{
                background: 'rgba(15, 21, 36, 0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(34, 197, 94, 0.1)',
                borderRadius: 24,
                padding: 16,
                display: 'flex',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#141c2e',
                  flexShrink: 0,
                }}
              >
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: '#e0e8f0', fontSize: 15 }}>{item.name}</h3>
                    <p style={{ fontSize: 12, color: '#a0b4c4', marginTop: 2 }}>
                      {t('cart.size')} {item.selectedSize}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id + item.selectedSize)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b4c4', padding: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ transform: 'scale(0.9)', display: 'block' }}>close</span>
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 9999,
                      padding: '4px 12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.id + item.selectedSize, item.quantity - 1)}
                      style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 500, width: 16, textAlign: 'center', color: '#e0e8f0' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id + item.selectedSize, item.quantity + 1)}
                      style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                    </button>
                  </div>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>₴{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {items.length > 0 && (
          <>
            {/* Order Summary */}
            <section
              style={{
                marginTop: 24,
                background: 'rgba(15, 21, 36, 0.75)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                borderRadius: 24,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: '#a0b4c4' }}>{t('cart.subtotal')}</span>
                <span style={{ color: '#e0e8f0', fontWeight: 500 }}>₴{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: '#a0b4c4' }}>{t('cart.shipping')}</span>
                <span style={{ color: '#a0b4c4', fontWeight: 400, fontSize: 12 }}>{t('cart.shipping.calc')}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', width: '100%', marginTop: 8, marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#e0e8f0' }}>{t('cart.total')}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>₴{subtotal.toLocaleString()}</span>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Sticky Checkout Button */}
      {items.length > 0 && (
        <div style={{ position: 'fixed', bottom: 96, left: 0, width: '100%', padding: '0 24px', zIndex: 40 }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              width: '100%',
              height: 64,
              background: '#22c55e',
              color: '#001f2e',
              border: 'none',
              borderRadius: 24,
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 0 30px rgba(125,209,250,0.3)',
            }}
          >
            <span>{t('cart.checkout')}</span>
            <span style={{ width: 6, height: 6, background: '#001f2e', borderRadius: '50%', display: 'inline-block' }} />
            <span>₴{subtotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      <BottomBar />
    </div>
  )
}
