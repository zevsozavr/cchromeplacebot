import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { BottomBar } from '../components/BottomBar'
import type { CartItem } from '../types'

const ORDERS_KEY = 'plugstreet_orders'

interface Order {
  id: string
  items: CartItem[]
  total: number
  date: string
  name: string
  phone: string
  address: string
}

export function OrderConfirmed() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY)
      if (raw) setOrders(JSON.parse(raw))
    } catch {}
  }, [])

  const lastOrder = orders[orders.length - 1]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 128 }}>
      <header
        style={{
          position: 'fixed', top: 0, width: '100%', zIndex: 50,
          background: 'rgba(15, 21, 36, 0.4)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 24px', height: 64,
        }}
      >
        <button style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#22c55e' }}>CCHROME PLACE</h1>
        <button onClick={() => navigate('/cart')} style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="material-symbols-outlined">shopping_bag</span>
        </button>
      </header>

      <main style={{ paddingTop: 96, paddingLeft: 24, paddingRight: 24, maxWidth: 512, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: 48 }}>check_circle</span>
          </div>
          <h2 style={{ color: '#22c55e', fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', marginBottom: 8 }}>
            {t('order.confirmed')}
          </h2>
          <p style={{ color: '#a0b4c4', fontWeight: 300, fontSize: 14, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
            {t('order.confirmed.msg')}
          </p>
        </div>

        {lastOrder && (
          <div style={{ width: '100%', background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 24, padding: 20, marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#a0b4c4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {t('order.reference')}
            </p>
            <p style={{ color: '#e0e8f0', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>#{lastOrder.id}</p>
            {lastOrder.items.map((item) => (
              <div key={item.id + item.selectedSize + item.selectedColor} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#a0b4c4' }}>{item.name} x{item.quantity}</span>
                <span style={{ color: '#e0e8f0' }}>₴{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 8, marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#e0e8f0' }}>{t('cart.total')}</span>
              <span style={{ fontWeight: 700, color: '#22c55e' }}>₴{lastOrder.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            const chatLink = `https://t.me/cchromeplacee`
            window.open(chatLink, '_blank')
          }}
          style={{
            width: '100%', height: 64, borderRadius: 9999,
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em',
            fontSize: 14, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 0 20px rgba(34, 197, 94,0.1)', marginBottom: 16,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
          {t('order.message.seller')}
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', height: 52, borderRadius: 9999,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a0b4c4', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {t('order.continue.shopping')}
        </button>
      </main>

      <BottomBar />
    </div>
  )
}
