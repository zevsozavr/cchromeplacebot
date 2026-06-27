import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useFavorites } from '../context/FavoritesContext'
import { useLang } from '../context/LangContext'
import { useMiniCart } from '../context/MiniCartContext'
import { BottomBar } from '../components/BottomBar'

export function Products() {
  const navigate = useNavigate()
  const { openCart } = useMiniCart()
  const { products, categories } = useData()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLang()
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeSubcategory, setActiveSubcategory] = useState('All')

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory && (activeSubcategory === 'All' || p.subcategory === activeSubcategory))

  const subcategories = activeCategory === 'All'
    ? []
    : [...new Set(products.filter((p) => p.category === activeCategory).map((p) => p.subcategory).filter((s): s is string => Boolean(s)))]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 128 }}>
      <header
        style={{
          position: 'fixed', top: 0, width: '100%', zIndex: 100,
          background: 'rgba(15, 21, 36, 0.4)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 24px', height: 64,
        }}
      >
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#a3a3a3', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#a3a3a3' }}>{t('products.title')}</h1>
        <button onClick={openCart} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#a3a3a3', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shopping_bag</span>
        </button>
      </header>

      {/* Category Filter */}
      <section
        style={{
          position: 'fixed', top: 64, width: '100%', zIndex: 99,
          padding: '12px 16px',
          overflowX: 'auto',
          display: 'flex', gap: 8,
          whiteSpace: 'nowrap',
          background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
        className="hide-scrollbar"
      >
        <button
          onClick={() => setActiveCategory('All')}
          style={{
            padding: '6px 18px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            flexShrink: 0,
            background: activeCategory === 'All' ? '#a3a3a3' : 'rgba(15, 21, 36, 0.6)',
            color: activeCategory === 'All' ? '#0a0a0a' : '#a0b4c4',
            border: activeCategory === 'All' ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {t('store.cat.all')}
        </button>
        {categories.filter((c) => c.name !== 'All').map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.name)}
            style={{
              padding: '6px 18px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              flexShrink: 0,
              background: activeCategory === c.name ? '#a3a3a3' : 'rgba(15, 21, 36, 0.6)',
              color: activeCategory === c.name ? '#0a0a0a' : '#a0b4c4',
              border: activeCategory === c.name ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {t('store.cat.' + c.name.toLowerCase()) || t('categories.' + c.name) || c.name}
          </button>
        ))}
      </section>

      {/* Subcategory Filter */}
      {activeCategory !== 'All' && subcategories.length > 0 && (
        <section
          style={{
            position: 'fixed', top: 108, width: '100%', zIndex: 98,
            padding: '8px 16px',
            overflowX: 'auto',
            display: 'flex', gap: 6,
            whiteSpace: 'nowrap',
            background: 'rgba(10,14,26,0.6)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            minHeight: 40,
          }}
          className="hide-scrollbar"
        >
          <button
            onClick={() => setActiveSubcategory('All')}
            style={{
              padding: '4px 14px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 500,
              flexShrink: 0,
              background: activeSubcategory === 'All' ? '#a3a3a3' : 'rgba(15, 21, 36, 0.6)',
              color: activeSubcategory === 'All' ? '#0a0a0a' : '#a0b4c4',
              border: activeSubcategory === 'All' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {t('store.cat.all')}
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(sub)}
              style={{
                padding: '4px 14px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                flexShrink: 0,
                background: activeSubcategory === sub ? '#a3a3a3' : 'rgba(15, 21, 36, 0.6)',
                color: activeSubcategory === sub ? '#0a0a0a' : '#a0b4c4',
                border: activeSubcategory === sub ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {sub}
            </button>
          ))}
          {/* Spacer to prevent clipping on scroll */}
          <div style={{ width: 16, flexShrink: 0 }} />
        </section>
      )}

      <main style={{ paddingTop: activeCategory !== 'All' && subcategories.length > 0 ? 152 : 116, paddingLeft: 16, paddingRight: 16, paddingBottom: 32 }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#4b5563', marginBottom: 12 }}>inventory_2</span>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#d1d5db' }}>{t('products.empty.category')}</p>
            <p style={{ fontSize: 13 }}>{t('products.empty.hint')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {filteredProducts.map((p, i) => {
              const aspectRatios = ['3/4', '4/5', '1/1', '3/4']
              const ar = aspectRatios[i % aspectRatios.length]
              return (
                <div key={p.id} className="group" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <div
                    style={{
                      position: 'relative', aspectRatio: ar,
                      borderRadius: 16, overflow: 'hidden',
                      background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(163, 163, 163, 0.1)', marginBottom: 12,
                    }}
                  >
                    <img
                      src={p.images?.[0] || p.image}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      className="group-hover:scale-110"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(p) }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(26, 36, 56, 0.75)', backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(163, 163, 163, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: isFavorite(p.id) ? '#ff6b6b' : '#a0b4c4', padding: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: isFavorite(p.id) ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                      </span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{p.name}</span>
                    <span style={{ fontSize: 14, color: '#a3a3a3' }}>₴{p.price.toLocaleString()}</span>
                  </div>
                  {p.subcategory && (
                    <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, display: 'block' }}>{p.subcategory}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomBar />
    </div>
  )
}


