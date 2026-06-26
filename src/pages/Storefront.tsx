import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { Header } from '../components/Header'
import { BottomBar } from '../components/BottomBar'

export function Storefront() {
  const navigate = useNavigate()
  const { products, collection, categories } = useData()
  const { addItem } = useCart()
  const { t } = useLang()

  const masonry = products.filter((p) => p.inCollection)
  const gridProducts = masonry.length > 0 ? masonry : products

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 128 }}>
      <Header left={<div style={{ width: 28 }} />} />

      <main style={{ paddingTop: 64 }}>
        {/* Hero Section */}
        {collection.enabled && <section
          style={{
            position: 'relative',
            width: '100%',
            height: 618,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 24px 48px',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundImage: `url(${collection.enabled ? collection.image : 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80'})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #0a0e1a, rgba(10,14,26,0.2), transparent)',
              }}
            />
          </div>
          <div style={{ position: 'relative', zIndex: 10, maxWidth: 576 }}>
            <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: '#e0e8f0' }}>
              {collection.enabled ? collection.title : t('store.hero.title')}
            </h2>
            <p style={{ color: '#a0b4c4', fontSize: 18, marginBottom: 32, maxWidth: 448 }}>
              {collection.enabled ? collection.subtitle : t('store.hero.text')}
            </p>
            <button
              onClick={() => navigate('/products')}
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                padding: '16px 32px',
                borderRadius: 9999,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
              className="glow-hover"
            >
              {t('store.view.collection')}
            </button>
          </div>
        </section>}

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
                background: cat.key === 'All' ? '#22c55e' : 'rgba(15, 21, 36, 0.6)',
                backdropFilter: cat.key === 'All' ? 'none' : 'blur(16px)',
                color: cat.key === 'All' ? '#001f2e' : '#a0b4c4',
                border: cat.key === 'All' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: cat.key === 'All' ? '0 0 15px rgba(123,209,250,0.3)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </section>

        {/* Highlight Card */}
        {collection.enabled && <section style={{ padding: '0 24px', marginBottom: 48 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 320,
              borderRadius: 24,
              overflow: 'hidden',
              background: 'rgba(15, 21, 36, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
            className="group"
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0a0e1a, transparent)', zIndex: 10 }} />
            <img
              src={collection.enabled ? collection.image : 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80'}
              alt="Featured"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 1s',
              }}
              className="group-hover:scale-105"
            />
            <div style={{ position: 'relative', zIndex: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', maxWidth: 448 }}>
              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                {collection.enabled ? collection.tag : t('store.highlight.tag')}
              </span>
              <h3 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, lineHeight: 1.2, color: '#e0e8f0' }}>
                {collection.enabled ? collection.title.toUpperCase() : 'THE ALPINE COLLECTION'}
              </h3>
              <button
                onClick={() => navigate('/products')}
                style={{
                  width: 'fit-content',
                  padding: '8px 24px',
                  borderRadius: 9999,
                  background: 'white',
                  color: 'black',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {t('store.view.collection')}
              </button>
            </div>
          </div>
        </section>}

        {/* Curated Selection (Masonry Grid) */}
        <section style={{ padding: '0 24px 80px' }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 32, color: '#e0e8f0' }}>{t('store.featured')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
            {/* Col 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {gridProducts.filter((_, i) => i % 2 === 0).map((p) => (
                <div key={p.id} className="group" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '3/4',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: 'rgba(15, 21, 36, 0.6)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(34, 197, 94, 0.1)',
                      marginBottom: 12,
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s',
                      }}
                      className="group-hover:scale-110"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(34, 197, 94, 0.1)',
                        opacity: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.3s',
                      }}
                      className="group-hover:opacity-100"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); addItem(p, p.sizes[0], p.colors[0].name) }}
                        style={{
                          padding: '8px 16px',
                          background: '#22c55e',
                          color: '#001f2e',
                          border: 'none',
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                      >
                        {t('product.add').toUpperCase()}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{p.name}</span>
                    <span style={{ fontSize: 14, color: '#22c55e' }}>₴{p.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Col 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 48 }}>
              {gridProducts.filter((_, i) => i % 2 === 1).map((p) => {
                const aspectRatios = ['4/5', '3/4', '1/1']
                const ar = aspectRatios[p.id.length % 3]
                return (
                  <div key={p.id} className="group" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: ar,
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: 'rgba(15, 21, 36, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(34, 197, 94, 0.1)',
                        marginBottom: 12,
                      }}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s',
                        }}
                        className="group-hover:scale-110"
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(34, 197, 94, 0.1)',
                          opacity: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'opacity 0.3s',
                        }}
                        className="group-hover:opacity-100"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); addItem(p, p.sizes[0], p.colors[0].name) }}
                          style={{
                            padding: '8px 16px',
                            background: '#22c55e',
                            color: '#001f2e',
                            border: 'none',
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                          }}
                        >
                          {t('product.add').toUpperCase()}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{p.name}</span>
                      <span style={{ fontSize: 14, color: '#22c55e' }}>₴{p.price.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <BottomBar />
    </div>
  )
}
