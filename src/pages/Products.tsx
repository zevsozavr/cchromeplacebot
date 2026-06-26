import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useFavorites } from '../context/FavoritesContext'
import { useLang } from '../context/LangContext'
import { useMiniCart } from '../context/MiniCartContext'
import { BottomBar } from '../components/BottomBar'

export function Products() {
  const navigate = useNavigate()
  const { openCart } = useMiniCart()
  const { products } = useData()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLang()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 128 }}>
      {/* Top App Bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 100,
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
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#22c55e', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#22c55e' }}>{t('products.title')}</h1>
        <button onClick={openCart} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#22c55e', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shopping_bag</span>
        </button>
      </header>

      <main style={{ paddingTop: 80, paddingLeft: 16, paddingRight: 16, paddingBottom: 32 }}>
        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {products.map((p, i) => {
            const aspectRatios = ['3/4', '4/5', '1/1', '3/4']
            const ar = aspectRatios[i % aspectRatios.length]
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
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(p) }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(26, 36, 56, 0.75)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isFavorite(p.id) ? '#ff6b6b' : '#a0b4c4',
                      padding: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: isFavorite(p.id) ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{p.name}</span>
                  <span style={{ fontSize: 14, color: '#22c55e' }}>₴{p.price.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <BottomBar />
    </div>
  )
}
