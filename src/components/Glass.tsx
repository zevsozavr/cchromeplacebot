import type { ReactNode, CSSProperties } from 'react'

interface GlassProps {
  children: ReactNode
  elevated?: boolean
  variant?: 'card' | 'elevated' | 'panel'
  style?: CSSProperties
  className?: string
  card?: boolean
  glow?: boolean
  onClick?: () => void
}

export function Glass({ children, elevated, variant = 'card', style, className = '', card: _card, glow, onClick }: GlassProps) {
  const cls = elevated || variant === 'elevated' ? 'glass-card-elevated' : variant === 'panel' ? 'glass-panel' : 'glass-card'
  const combined: CSSProperties = {
    ...(glow ? { boxShadow: '0 0 15px rgba(34, 197, 94,0.08)' } : {}),
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...style,
  }
  return <div className={`${cls} ${className}`} style={combined} onClick={onClick}>{children}</div>
}
