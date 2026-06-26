import type { CSSProperties } from 'react'

interface ProductCardProps {
  image: string
  name: string
  price: string
  onAddToCart?: () => void
  style?: CSSProperties
  aspectRatio?: string
  showAddButton?: boolean
  showFavorite?: boolean
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function ProductCard({
  image, name, price, onAddToCart, style, aspectRatio = '3/4',
  showAddButton = false, showFavorite, isFavorite, onToggleFavorite,
}: ProductCardProps) {
  return (
    <div className="group" style={{ ...style }}>
      <div
        style={{
          position: 'relative',
          aspectRatio,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'rgba(15, 21, 36, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(34, 197, 94, 0.1)',
          marginBottom: 12,
        }}
      >
        <img
          src={image}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s',
          }}
          className="group-hover:scale-110"
        />
        {showAddButton && (
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
              onClick={onAddToCart}
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
              ADD TO BAG
            </button>
          </div>
        )}
        {showFavorite && (
          <button
            onClick={onToggleFavorite}
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
              color: isFavorite ? '#ff6b6b' : '#a0b4c4',
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{name}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{price}</span>
      </div>
    </div>
  )
}

export function ProductCardHorizontal({ image, name, price, onAddToCart }: ProductCardProps) {
  return (
    <div className="min-w-[280px] group">
      <div
        style={{
          position: 'relative',
          height: 380,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'rgba(15, 21, 36, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(34, 197, 94, 0.1)',
          marginBottom: 16,
        }}
      >
        <img
          src={image}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.7s',
          }}
          className="group-hover:scale-110"
        />
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            transform: 'translateY(48px)',
            opacity: 0,
            transition: 'all 0.3s',
          }}
          className="group-hover:translate-y-0 group-hover:opacity-100"
        >
          <button
            onClick={onAddToCart}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#22c55e',
              color: '#001f2e',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add_shopping_cart</span>
          </button>
        </div>
      </div>
      <p style={{ fontWeight: 600, color: '#e0e8f0' }}>{name}</p>
      <p style={{ color: '#a0b4c4', fontSize: 14 }}>{price}</p>
    </div>
  )
}
