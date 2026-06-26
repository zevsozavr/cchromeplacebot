import type { ReactNode, CSSProperties } from 'react'
import { useMiniCart } from '../context/MiniCartContext'

interface HeaderProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  title?: string
  showBack?: boolean
  onBack?: () => void
  onRightClick?: () => void
}

export function Header({ left, center, right, title, showBack, onBack, onRightClick }: HeaderProps) {
  const { openCart } = useMiniCart()
  const base: CSSProperties = {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 100,
    background: 'rgba(15, 21, 36, 0.4)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: 64,
  }

  if (showBack) {
    return (
      <header style={base}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: 0, display: 'flex' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'Inter', color: '#e0e8f0', fontWeight: 600, fontSize: 18 }}>{title}</h1>
        <div style={{ width: 24 }} />
      </header>
    )
  }

  return (
    <header style={base}>
      {left || (
        <button style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{title ? 'arrow_back' : 'menu'}</span>
        </button>
      )}
      {center || (title ? (
        <h1 style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 600, color: '#e0e8f0' }}>{title}</h1>
      ) : (
        <h1 style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#22c55e' }}>CCHROME PLACE</h1>
      ))}
      {right || (
        <button onClick={onRightClick ?? openCart} style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{title ? 'more_vert' : 'shopping_bag'}</span>
        </button>
      )}
    </header>
  )
}
