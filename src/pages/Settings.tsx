import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useMiniCart } from '../context/MiniCartContext'

import { BottomBar } from '../components/BottomBar'

interface Order {
  id: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  date: string
}

export function Settings() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { lang, setLang, t } = useLang()
  const { openCart } = useMiniCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [showOrders, setShowOrders] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('plugstreet_orders')
      if (raw) setOrders(JSON.parse(raw))
    } catch {}
  }, [])

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(15, 21, 36, 0.6)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    cursor: 'pointer',
  }

  const rowBorder: React.CSSProperties = {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', maxWidth: 390, margin: '0 auto', overflowX: 'hidden', paddingBottom: 128 }}>
      {/* Top App Bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          maxWidth: 390,
          background: 'rgba(15, 21, 36, 0.4)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          height: 64,
        }}
      >
        <div style={{ width: 24 }} />
        <h1 style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#22c55e' }}>CCHROME PLACE</h1>
        <span className="material-symbols-outlined" style={{ color: '#22c55e', cursor: 'pointer' }} onClick={openCart}>shopping_bag</span>
      </header>

      <main style={{ paddingTop: 96, paddingLeft: 24, paddingRight: 24 }}>



        {/* Preferences */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, color: '#9ca3af', opacity: 0.7, padding: '0 4px', marginBottom: 12 }}>
            {t('settings.preferences')}
          </h3>
          <div style={sectionStyle}>
            <div style={{ ...rowStyle, ...rowBorder }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 24,
                    background: 'rgba(200, 160, 240, 0.1)',
                    color: '#9ca3af',
                  }}
                >
                  <span className="material-symbols-outlined">language</span>
                </div>
                <span style={{ fontWeight: 500, color: '#e0e8f0' }}>{t('settings.lang')}</span>
              </div>
              <div onClick={() => setLang(lang === 'UA' ? 'RU' : 'UA')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'UA' ? 'Українська' : 'Русский'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
              </div>
            </div>
          </div>
        </section>



        {/* Order History */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, color: '#9ca3af', opacity: 0.7, padding: '0 4px', marginBottom: 12 }}>
            {t('settings.history')}
          </h3>
          <div style={sectionStyle}>
            <div style={{ ...rowStyle }} onClick={() => setShowOrders(!showOrders)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 24, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: '#e0e8f0', display: 'block' }}>{t('settings.history')}</span>
                  <span style={{ fontSize: 12, color: '#a0b4c4' }}>{orders.length} {t('settings.orders')}</span>
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#a0b4c4', transform: showOrders ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
            </div>
            {showOrders && orders.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 16 }}>
                {[...orders].reverse().map((o) => (
                  <div key={o.id} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>#{o.id}</span>
                      <span style={{ fontSize: 11, color: '#a0b4c4' }}>{new Date(o.date).toLocaleDateString()}</span>
                    </div>
                    {o.items.map((item) => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#a0b4c4' }}>{item.name} x{item.quantity}</span>
                        <span style={{ color: '#e0e8f0' }}>₴{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8, paddingTop: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e8f0' }}>{t('cart.total')}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>₴{o.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showOrders && orders.length === 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#a0b4c4' }}>{t('settings.no.orders')}</p>
              </div>
            )}
          </div>
        </section>

        {/* About */}
        <section style={{ paddingTop: 16, paddingBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a0b4c4' }}>
            {t('settings.version')} 4.2.0{t('settings.version.suffix')}
          </p>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '12px 32px',
                borderRadius: 9999,
                background: 'rgba(200, 160, 240, 0.2)',
                border: '1px solid rgba(200, 160, 240, 0.3)',
                color: '#9ca3af',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {t('settings.panel')}
            </button>
          )}
        </section>
      </main>

      <BottomBar />
    </div>
  )
}
