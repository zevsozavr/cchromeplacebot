import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'

export function Checkout() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { shipping: shippingConfig } = useData()
  const { t } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const subtotal = totalPrice
  const shipping = subtotal >= shippingConfig.freeShippingThreshold ? 0 : shippingConfig.novaPoshtaPrice
  const total = subtotal + shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const address = `${city}, ${t('checkout.np_warehouse')} ${warehouse}`
    const order = {
      id: Date.now().toString(36).toUpperCase(),
      items: [...items],
      total,
      shipping,
      date: new Date().toISOString(),
      name,
      phone,
      address,
      status: 'new',
    }

    // Save order to localStorage + DB
    try {
      const existing = JSON.parse(localStorage.getItem('plugstreet_orders') || '[]')
      existing.push(order)
      localStorage.setItem('plugstreet_orders', JSON.stringify(existing))
    } catch {}

    // Sync order to database
    try {
      const res = await fetch('/api/data')
      if (res.ok) {
        const dbData = await res.json()
        const orders = [...(dbData.orders || []), order]
        await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dbData, orders }),
        })
      }
    } catch {}

    try {
      const msg = [
        `🛒 *Нове замовлення!*`,
        `👤 *${name}*`,
        `📞 ${phone}`,
        `📍 ${address}`,
        '',
        ...items.map((i) => `• ${i.name} (${i.selectedSize}, ${i.selectedColor}) x${i.quantity} — ₴${(i.price * i.quantity).toLocaleString()}`),
        '',
        `💰 *Всього: ₴${total.toLocaleString()}*`,
        `🆔 #${order.id}`,
      ].join('\n')

      const adminIds = [7264276513, 822479618]
      await Promise.allSettled(adminIds.map((chat_id) =>
        fetch(`https://api.telegram.org/bot${import.meta.env.VITE_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text: msg, parse_mode: 'Markdown' }),
        })
      ))
    } catch {}

    clearCart()
    navigate('/order-confirmed')
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
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
        <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#22c55e', display: 'flex' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', color: '#e0e8f0', fontWeight: 600, fontSize: 18 }}>{t('checkout.title')}</h1>
        <div style={{ width: 24 }} />
      </header>

      <main style={{ paddingTop: 80, paddingLeft: 16, paddingRight: 16, paddingBottom: 120 }}>
        <form onSubmit={handleSubmit}>
          {/* Contact Info */}
          <section
            style={{
              background: 'rgba(15, 21, 36, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(34, 197, 94, 0.1)',
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 16 }}>{t('checkout.contact')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('checkout.placeholder.name')}
                required
                style={{
                  width: '100%',
                  height: 48,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '0 16px',
                  color: '#e0e8f0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('checkout.placeholder.phone')}
                required
                style={{
                  width: '100%',
                  height: 48,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '0 16px',
                  color: '#e0e8f0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </section>

          {/* Delivery — Nova Poshta */}
          <section
            style={{
              background: 'rgba(15, 21, 36, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(34, 197, 94, 0.1)',
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 16 }}>{t('checkout.delivery')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('checkout.placeholder.city')}
                required
                style={{
                  width: '100%', height: 48,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '0 16px',
                  color: '#e0e8f0', fontSize: 14, outline: 'none',
                }}
              />
              <input
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                placeholder={t('checkout.placeholder.warehouse')}
                required
                style={{
                  width: '100%', height: 48,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '0 16px',
                  color: '#e0e8f0', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </section>

          {/* Order Summary */}
          <section
            style={{
              background: 'rgba(15, 21, 36, 0.75)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 16 }}>{t('checkout.summary')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <div key={item.id + item.selectedSize + item.selectedColor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <span style={{ color: '#a0b4c4' }}>
                    {item.name} x{item.quantity}
                  </span>
                  <span style={{ color: '#e0e8f0', fontWeight: 500 }}>₴{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 16, marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: '#a0b4c4' }}>{t('cart.subtotal')}</span>
              <span style={{ color: '#e0e8f0' }}>₴{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: '#a0b4c4' }}>{t('cart.shipping')}</span>
              <span style={{ color: shipping === 0 ? '#22c55e' : '#e0e8f0', fontWeight: 500 }}>
                {shipping === 0 ? t('cart.shipping.free') : `₴${shipping.toLocaleString()}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
              <span style={{ color: '#e0e8f0' }}>{t('cart.total')}</span>
              <span style={{ color: '#22c55e' }}>₴{total.toLocaleString()}</span>
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: 56,
              background: '#22c55e',
              color: '#001f2e',
              border: 'none',
              borderRadius: 24,
              fontWeight: 700,
              fontSize: 16,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 0 20px rgba(34, 197, 94,0.3)',
            }}
          >
            {submitting ? t('checkout.processing') : t('checkout.place')}
          </button>
        </form>
      </main>
    </div>
  )
}
