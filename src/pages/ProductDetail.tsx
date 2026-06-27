import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { useLang } from '../context/LangContext'

export function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useData()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLang()

  const product = products.find((p) => p.id === id)
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || '')
  const [currentImage, setCurrentImage] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!product) return
    setSelectedSize(product.sizes?.[0] || '')
    setCurrentImage(0)
  }, [product])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const handleScroll = () => {
      const idx = Math.round(el.scrollLeft / el.offsetWidth)
      setCurrentImage(idx)
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  if (!product) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ color: '#a0b4c4' }}>{t('product.notfound')}</p>
      </div>
    )
  }

  const images = product.images?.length ? product.images : (product.image ? [product.image] : [])
  const fav = isFavorite(product.id)
  const getSizeStock = (size: string) => product.sizeStock?.[size] ?? product.stock ?? 5
  const outOfStockAll = product.sizes?.every((s) => getSizeStock(s) <= 0) ?? true

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 140 }}>
      {/* Top Navigation */}
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
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(15, 21, 36, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(163, 163, 163, 0.1)',
            cursor: 'pointer',
            color: '#a3a3a3',
            padding: 0,
          }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#a3a3a3' }}>CCHROME PLACE</span>
        <button
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(15, 21, 36, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(163, 163, 163, 0.1)',
            cursor: 'pointer',
            color: '#a3a3a3',
            padding: 0,
          }}
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main style={{ paddingTop: 64 }}>
        {/* Image Carousel */}
        <section
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/5',
            overflow: 'hidden',
            background: '#0f1524',
          }}
        >
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
            }}
            className="hide-scrollbar"
          >
            {images.map((img, i) => (
              <div key={i} style={{ flexShrink: 0, width: '100%', height: '100%', scrollSnapAlign: 'center' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          {/* Pagination Dots */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 8,
            }}
          >
            {images.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentImage ? 24 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: i === currentImage ? '#a3a3a3' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </section>

        {/* Product Details Panel */}
        <section style={{ padding: '0 24px', marginTop: -32, position: 'relative', zIndex: 10 }}>
          <div
            style={{
              background: 'rgba(26, 36, 56, 0.75)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(163, 163, 163, 0.15)',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Info Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: '#e0e8f0' }}>
                  {product.name.toUpperCase()}
                </h1>
                <p style={{ color: '#a0b4c4', fontWeight: 500, marginTop: 4 }}>{product.condition}</p>
                <p style={{ fontSize: 12, color: outOfStockAll ? '#ff6b6b' : '#a3a3a3', marginTop: 2 }}>
                  {outOfStockAll ? t('product.out_of_stock') : `${t('product.stock')}: ${getSizeStock(selectedSize)}`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#a3a3a3' }}>₴{product.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Size Selector */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0b4c4', marginBottom: 12 }}>
                {t('product.size')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {(product.sizes || []).map((s) => {
                  const active = s === selectedSize
                  const stock = getSizeStock(s)
                  const soldOut = stock <= 0
                  return (
                    <button
                      key={s}
                      onClick={() => { if (!soldOut) setSelectedSize(s) }}
                      style={{
                        height: 48,
                        borderRadius: 16,
                        cursor: soldOut ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        background: active ? '#a3a3a3' : 'rgba(15, 21, 36, 0.6)',
                        backdropFilter: active ? 'none' : 'blur(16px)',
                        border: active ? 'none' : '1px solid rgba(163, 163, 163, 0.1)',
                        color: soldOut ? '#6b7280' : active ? '#0a0a0a' : '#e0e8f0',
                        boxShadow: active ? '0 0 15px rgba(123,209,250,0.3)' : 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      }}
                    >
                      <span>{s}</span>
                      {soldOut && <span style={{ fontSize: 9, color: '#ef4444' }}>{t('product.out_of_stock_short')}</span>}
                      {!soldOut && stock <= 3 && <span style={{ fontSize: 8, color: '#9ca3af' }}>{stock}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0b4c4' }}>
                {t('product.quantity')}
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  background: 'rgba(15, 21, 36, 0.6)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(163, 163, 163, 0.1)',
                  borderRadius: 9999,
                  padding: '8px 16px',
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#a3a3a3', cursor: 'pointer', fontSize: 24 }}>remove</span>
                <span style={{ fontWeight: 700, width: 16, textAlign: 'center' }}>1</span>
                <span className="material-symbols-outlined" style={{ color: '#a3a3a3', cursor: 'pointer', fontSize: 24 }}>add</span>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section style={{ padding: '0 24px', marginTop: 16 }}>
          <div style={{ background: 'rgba(15, 21, 36, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(163, 163, 163, 0.1)', borderRadius: 24, padding: 16 }}>
            <p style={{ fontSize: 14, color: '#a0b4c4', lineHeight: 1.6 }}>
              {product.description}
            </p>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 60,
          padding: 24,
          background: 'linear-gradient(to top, #0a0e1a, rgba(10,14,26,0.8), transparent)',
        }}
      >
        <div
          style={{
            background: 'rgba(26, 36, 56, 0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(163, 163, 163, 0.15)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={() => toggleFavorite(product)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 24,
              background: 'rgba(15, 21, 36, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(163, 163, 163, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: fav ? '#ff6b6b' : '#a0b4c4',
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: fav ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
          </button>
          <button
            onClick={() => { addItem(product, selectedSize); navigate('/cart'); }}
            disabled={getSizeStock(selectedSize) <= 0}
            style={{
              flex: 1,
              height: 56,
              background: getSizeStock(selectedSize) <= 0 ? 'rgba(255,255,255,0.1)' : '#a3a3a3',
              color: getSizeStock(selectedSize) <= 0 ? '#a0b4c4' : '#0a0a0a',
              border: 'none',
              borderRadius: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              cursor: getSizeStock(selectedSize) <= 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: getSizeStock(selectedSize) <= 0 ? 'none' : '0 0 20px rgba(163, 163, 163,0.4)',
            }}
            className="glow-hover"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_mall</span>
            {getSizeStock(selectedSize) <= 0 ? t('product.out_of_stock') : t('product.add')}
          </button>
        </div>
      </div>
    </div>
  )
}


