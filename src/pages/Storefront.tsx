import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { Header } from '../components/Header'
import { BottomBar } from '../components/BottomBar'

export function Storefront() {
  const navigate = useNavigate()
  const { products, categories } = useData()
  const { addItem } = useCart()
  const { t } = useLang()

  const isOutOfStock = (p: typeof products[0]) =>
    p.sizes?.every((s) => (p.sizeStock?.[s] ?? p.stock ?? 5) <= 0) ?? true

  const gridProducts = [...products].sort((a, b) => {
    if (isOutOfStock(a) && !isOutOfStock(b)) return 1
    if (!isOutOfStock(a) && isOutOfStock(b)) return -1
    return 0
  })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 128 }}>
      <Header left={<div style={{ width: 28 }} />} />

      <main style={{ paddingTop: 64 }}>
        {/* Category Chips */}
        <section
          style={{
            padding: '32px 24px',
            overflowX: 'auto',
            display: 'flex',
            gap: 12,
            whiteSpace: 'nowrap',
            position: 'sticky',
            top: 64,
            background: 'rgba(10,14,26,0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 40,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
          className="hide-scrollbar"
        >
          {[
            { key: 'All', label: t('store.cat.all') },
            ...categories.filter((c) => c.name !== 'All').map((c) => ({
              key: c.name,
              label: t('store.cat.' + c.name.toLowerCase()) || t('categories.' + c.name) || c.name,
            })),
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate('/products')}
              style={{
                padding: '8px 24px',
                borderRadius: 9999,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                flexShrink: 0,
                background: cat.key === 'All' ? '#a3a3a3' : 'rgba(15, 21, 36, 0.6)',
                backdropFilter: cat.key === 'All' ? 'none' : 'blur(16px)',
                color: cat.key === 'All' ? '#0a0a0a' : '#a0b4c4',
                border: cat.key === 'All' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: cat.key === 'All' ? '0 0 15px rgba(123,209,250,0.3)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </section>

        {/* Curated Selection */}
        <section style={{ padding: '0 24px 80px' }}>
          {gridProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#4b5563', marginBottom: 12 }}>inventory_2</span>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#d1d5db' }}>{t('products.empty.category')}</p>
              <p style={{ fontSize: 13 }}>{t('products.empty.hint')}</p>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {gridProducts.filter((_, i) => i % 2 === 0).map((p) => {
                const oos = isOutOfStock(p)
                return (
                <div key={p.id} className="group" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <div
                    style={{
                      position: 'relative', aspectRatio: '3/4',
                      borderRadius: 16, overflow: 'hidden',
                      background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)',
                      border: oos ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(163, 163, 163, 0.1)',
                      marginBottom: 12,
                      filter: oos ? 'grayscale(0.8)' : 'none',
                      opacity: oos ? 0.5 : 1,
                    }}
                  >
                    <img
                      src={p.images?.[0] || p.image}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      className="group-hover:scale-110"
                    />
                    {oos && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(10,14,26,0.7)', padding: '4px 10px', borderRadius: 9999 }}>{t('product.out_of_stock_short')}</span>
                      </div>
                    )}
                    {!oos && (
                    <div
                      style={{
                        position: 'absolute', inset: 0, background: 'rgba(163, 163, 163, 0.1)',
                        opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.3s',
                      }}
                      className="group-hover:opacity-100"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); addItem(p, p.sizes?.[0] || '') }}
                        style={{
                          padding: '8px 16px', background: '#a3a3a3', color: '#0a0a0a',
                          border: 'none', borderRadius: 9999, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                      >
                        {t('product.add').toUpperCase()}
                      </button>
                    </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: oos ? '#6b7280' : '#e0e8f0' }}>{p.name}</span>
                    <span style={{ fontSize: 14, color: oos ? '#6b7280' : '#a3a3a3' }}>₴{p.price.toLocaleString()}</span>
                  </div>
                  {p.subcategory && (
                    <span style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'block' }}>{p.subcategory}</span>
                  )}
                </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 48 }}>
              {gridProducts.filter((_, i) => i % 2 === 1).map((p) => {
                const aspectRatios = ['4/5', '3/4', '1/1']
                const ar = aspectRatios[p.id.length % 3]
                const oos = isOutOfStock(p)
                return (
                  <div key={p.id} className="group" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <div
                      style={{
                        position: 'relative', aspectRatio: ar,
                        borderRadius: 16, overflow: 'hidden',
                        background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)',
                        border: oos ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(163, 163, 163, 0.1)',
                        marginBottom: 12,
                        filter: oos ? 'grayscale(0.8)' : 'none',
                        opacity: oos ? 0.5 : 1,
                      }}
                    >
                      <img
                        src={p.images?.[0] || p.image}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                        className="group-hover:scale-110"
                      />
                      {oos && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(10,14,26,0.7)', padding: '4px 10px', borderRadius: 9999 }}>{t('product.out_of_stock_short')}</span>
                        </div>
                      )}
                      {!oos && (
                      <div
                        style={{
                          position: 'absolute', inset: 0, background: 'rgba(163, 163, 163, 0.1)',
                          opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'opacity 0.3s',
                        }}
                        className="group-hover:opacity-100"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); addItem(p, p.sizes?.[0] || '') }}
                          style={{
                            padding: '8px 16px', background: '#a3a3a3', color: '#0a0a0a',
                            border: 'none', borderRadius: 9999, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                          }}
                        >
                          {t('product.add').toUpperCase()}
                        </button>
                      </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: oos ? '#6b7280' : '#e0e8f0' }}>{p.name}</span>
                      <span style={{ fontSize: 14, color: oos ? '#6b7280' : '#a3a3a3' }}>₴{p.price.toLocaleString()}</span>
                    </div>
                    {p.subcategory && (
                      <span style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'block' }}>{p.subcategory}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          )}
        </section>
      </main>

      <BottomBar />
    </div>
  )
}


