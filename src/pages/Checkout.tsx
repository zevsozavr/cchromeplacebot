import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { estimateWeight } from '../lib/pricing'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 48,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16, padding: '0 16px',
  color: '#e0e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block',
};

export function Checkout() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { products, updateProduct } = useData()
  const { t } = useLang()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [prepay, setPrepay] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState(false)

  // NP city search
  const [cityQuery, setCityQuery] = useState('')
  const [cities, setCities] = useState<{ ref: string; name: string }[]>([])
  const [selectedCity, setSelectedCity] = useState<{ ref: string; name: string } | null>(null)
  const [cityOpen, setCityOpen] = useState(false)

  // NP warehouse search
  const [warehouseQuery, setWarehouseQuery] = useState('')
  const [warehouses, setWarehouses] = useState<{ ref: string; name: string; number: string }[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ ref: string; name: string; number: string } | null>(null)
  const [warehouseOpen, setWarehouseOpen] = useState(false)

  // Restore previous user data from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('plugstreet_user') || '{}')
      if (saved.name) setName(saved.name)
      if (saved.phone) setPhone(saved.phone)
      if (saved.cityName) setCityQuery(saved.cityName)
      if (saved.cityRef && saved.cityName) {
        setSelectedCity({ ref: saved.cityRef, name: saved.cityName })
      }
      if (saved.warehouseName) setWarehouseQuery(saved.warehouseName)
      if (saved.warehouseRef && saved.warehouseName && saved.warehouseNumber) {
        setSelectedWarehouse({ ref: saved.warehouseRef, name: saved.warehouseName, number: saved.warehouseNumber })
      }
    } catch {}
  }, [])

  // NP cost
  const [shippingCost, setShippingCost] = useState<number | null>(null)
  const [costLoading, setCostLoading] = useState(false)

  const weight = estimateWeight(items.length)
  const subtotal = totalPrice
  const shipping = shippingCost ?? 0
  const total = subtotal + shipping
  const afterpayCommissionRate = 0.02
  const afterpayCommission = prepay ? 0 : Math.round(subtotal * afterpayCommissionRate)
  const totalWithCommission = total + afterpayCommission

  // Debounced city search — skip when query matches already-selected city
  useEffect(() => {
    if (cityQuery.length < 2 || cityQuery === selectedCity?.name) { setCities([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/np-cities?q=${encodeURIComponent(cityQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setCities(data)
          setCityOpen(true)
        }
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [cityQuery, selectedCity?.name])

  // Debounced warehouse search — skip when query matches already-selected warehouse
  useEffect(() => {
    if (!selectedCity || warehouseQuery === selectedWarehouse?.name) { setWarehouses([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/np-warehouses?cityRef=${selectedCity.ref}&q=${encodeURIComponent(warehouseQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setWarehouses(data)
          setWarehouseOpen(true)
        }
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [warehouseQuery, selectedCity, selectedWarehouse?.name])

  // Calculate NP cost when city changes
  useEffect(() => {
    if (!selectedCity) { setShippingCost(null); return }
    setCostLoading(true)
    fetch('/api/np-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityRecipientRef: selectedCity.ref, weight, declaredCost: subtotal }),
    }).then((r) => r.json()).then((d) => {
      setShippingCost(d.cost ?? null)
      setCostLoading(false)
    }).catch(() => { setShippingCost(null); setCostLoading(false) })
  }, [selectedCity, weight, subtotal])

  const selectCity = (c: { ref: string; name: string }) => {
    setSelectedCity(c)
    setCityQuery(c.name)
    setCityOpen(false)
    setSelectedWarehouse(null)
    setWarehouseQuery('')
  }

  const selectWarehouse = (w: { ref: string; name: string; number: string }) => {
    setSelectedWarehouse(w)
    setWarehouseQuery(w.name)
    setWarehouseOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCity || !selectedWarehouse) return
    if (name.trim().split(/\s+/).length < 2) {
      setNameError(true)
      return
    }
    setNameError(false)
    setSubmitting(true)

    const address = `${selectedCity.name}, ${t('checkout.np_warehouse')} ${selectedWarehouse.name}`

    const shipDescription = 'одяг'

    // Create NP shipment first — its TTN becomes the order ID.
    let ttn = ''
    try {
      const shipRes = await fetch('/api/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityRef: selectedCity.ref,
          warehouseRef: selectedWarehouse.ref,
          warehouseNumber: selectedWarehouse.number,
          recipientName: name,
          recipientPhone: phone,
          declaredCost: subtotal,
          afterpayAmount: prepay ? 0 : subtotal,
          weight,
          prepay,
          description: shipDescription,
        }),
      })
      const shipData = await shipRes.json()
      if (shipRes.ok) {
        ttn = shipData.ttn || ''
      } else {
        console.error('[checkout] NP shipment failed:', shipData.error)
      }
    } catch (err) {
      console.error('[checkout] NP shipment exception:', err)
    }

    // Use the NP TTN as the order ID so in-app number = NP tracking number.
    // Fall back to a timestamp ID if shipment creation failed (no sender config yet).
    const orderId = ttn || Date.now().toString(36).toUpperCase()

    const order = {
      id: orderId,
      items: [...items],
      total: prepay ? total : totalWithCommission,
      shipping,
      date: new Date().toISOString(),
      name,
      phone,
      address,
      status: 'new',
      ttn: ttn || undefined,
      prepay,
      npCity: selectedCity.name,
      npWarehouse: selectedWarehouse.name,
      afterpayCommission: !prepay ? afterpayCommission : 0,
    }

    // Save order to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('plugstreet_orders') || '[]')
      existing.push(order)
      localStorage.setItem('plugstreet_orders', JSON.stringify(existing))
    } catch {}

    // Securely save order to DB and notify admin on the backend
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          order,
        }),
      })
    } catch (err) {
      console.error('Error submitting order to backend:', err);
    }

    // Decrement stock
    const outOfStockAlerts: string[] = []
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.id)
      if (!product) return
      const currentStock = product.sizeStock?.[item.selectedSize] ?? product.stock ?? 5
      const newQty = Math.max(0, currentStock - item.quantity)
      if (newQty <= 0) {
        outOfStockAlerts.push(`${product.name} (${item.selectedSize})`)
      }
      updateProduct(item.id, {
        sizeStock: { ...product.sizeStock, [item.selectedSize]: newQty },
        stock: Math.max(0, (product.stock ?? 5) - item.quantity),
      })
    })

    // Send TTN and checkouts are fully completed on backend.
    // Notify admin about out-of-stock items if any
    if (outOfStockAlerts.length > 0) {
      try {
        const msg = `⚠️ *Закінчився товар!*\n\n${outOfStockAlerts.map((s) => `• ${s}`).join('\n')}`
        const adminIds = [7264276513, 822479618]
        await Promise.allSettled(adminIds.map((chat_id) =>
          fetch(`https://api.telegram.org/bot${import.meta.env.VITE_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text: msg, parse_mode: 'Markdown' }),
          })
        ))
      } catch {}
    }

    // Save user data for next purchase
    try {
      localStorage.setItem('plugstreet_user', JSON.stringify({
        name,
        phone,
        cityRef: selectedCity.ref,
        cityName: selectedCity.name,
        warehouseRef: selectedWarehouse.ref,
        warehouseName: selectedWarehouse.name,
        warehouseNumber: selectedWarehouse.number,
      }))
    } catch {}

    clearCart()
    navigate('/order-confirmed')
  }

  const canSubmit = name && phone && selectedCity && selectedWarehouse && !submitting

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(15, 21, 36, 0.4)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: 64,
      }}>
        <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#22c55e', display: 'flex' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', color: '#e0e8f0', fontWeight: 600, fontSize: 18 }}>{t('checkout.title')}</h1>
        <div style={{ width: 24 }} />
      </header>

      <main style={{ paddingTop: 80, paddingLeft: 16, paddingRight: 16, paddingBottom: 120 }}>
        <form onSubmit={handleSubmit}>
          {/* Contact Info */}
          <section style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 24, padding: 24, marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 16 }}>{t('checkout.contact')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={name} onChange={(e) => { setName(e.target.value); setNameError(false) }} placeholder={t('checkout.placeholder.name')} required style={{ ...inputStyle, border: nameError ? '1px solid #ff6b6b' : inputStyle.border }} />
              {nameError && <span style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{t('checkout.name_required') || 'Введіть імʼя та прізвище'}</span>}
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('checkout.placeholder.phone')} required style={inputStyle} />
            </div>
          </section>

          {/* NP City Search */}
          <section style={{
            position: 'relative', zIndex: 10,
            background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 24, padding: 24, marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 16 }}>{t('checkout.delivery')}</h3>

            <div style={{ marginBottom: 12, position: 'relative' }}>
              <span style={labelStyle}>{t('checkout.city')}</span>
              <input
                value={cityQuery}
                onChange={(e) => { setCityQuery(e.target.value); if (selectedCity && e.target.value !== selectedCity.name) setSelectedCity(null) }}
                onFocus={() => setCityOpen(true)}
                onBlur={() => setTimeout(() => setCityOpen(false), 250)}
                placeholder={t('checkout.placeholder.city')}
                style={inputStyle}
              />
              {cityOpen && cities.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                  background: '#1a2438', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto',
                }}>
                  {cities.map((c) => (
                    <button key={c.ref} type="button" onClick={() => selectCity(c)}
                      style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', color: '#e0e8f0', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <span style={labelStyle}>{t('checkout.np_warehouse')}</span>
              <input
                value={warehouseQuery}
                onChange={(e) => { setWarehouseQuery(e.target.value); if (selectedWarehouse && e.target.value !== selectedWarehouse.name) setSelectedWarehouse(null) }}
                onFocus={() => setWarehouseOpen(true)}
                onBlur={() => setTimeout(() => setWarehouseOpen(false), 250)}
                placeholder={t('checkout.placeholder.warehouse')}
                style={inputStyle}
                disabled={!selectedCity}
              />
              {warehouseOpen && warehouses.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                  background: '#1a2438', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto',
                }}>
                  {warehouses.map((w) => (
                    <button key={w.ref} type="button" onClick={() => selectWarehouse(w)}
                      style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', color: '#e0e8f0', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Prepay option */}
          <section style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 24, padding: 24, marginBottom: 16,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={prepay} onChange={(e) => setPrepay(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: '#22c55e', cursor: 'pointer' }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{t('checkout.prepay')}</p>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>{t('checkout.prepay.hint')}</p>
              </div>
            </label>
          </section>

          {/* Order Summary */}
          <section style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(15, 21, 36, 0.75)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: 24, padding: 24, marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0', marginBottom: 16 }}>{t('checkout.summary')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <div key={item.id + item.selectedSize} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <span style={{ color: '#a0b4c4' }}>{item.name} x{item.quantity}</span>
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
              <span style={{ color: costLoading ? '#9ca3af' : '#e0e8f0', fontWeight: 500 }}>
                {costLoading ? t('cart.shipping.calc') : shipping > 0 ? `₴${shipping.toLocaleString()}` : '—'}
              </span>
            </div>
            {!prepay && afterpayCommission > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: '#a0b4c4' }}>Комісія післяплати (2%)</span>
                <span style={{ color: '#22c55e' }}>+₴{afterpayCommission.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: !prepay && afterpayCommission > 0 ? 8 : 0, fontSize: 18, fontWeight: 700 }}>
              <span style={{ color: '#e0e8f0' }}>{t('cart.total')}</span>
              <span style={{ color: '#22c55e' }}>₴{(prepay ? total : totalWithCommission).toLocaleString()}</span>
            </div>
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', height: 56,
              background: canSubmit ? '#22c55e' : 'rgba(255,255,255,0.1)',
              color: canSubmit ? '#001f2e' : '#a0b4c4',
              border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 16,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: submitting ? 0.7 : 1,
              boxShadow: canSubmit ? '0 0 20px rgba(34, 197, 94,0.3)' : 'none',
            }}
          >
            {submitting ? t('checkout.processing') : t('checkout.place')}
          </button>
        </form>
      </main>
    </div>
  )
}
