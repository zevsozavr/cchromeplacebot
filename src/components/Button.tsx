import type { ReactNode, CSSProperties, MouseEvent } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'glass' | 'ghost'
  fullWidth?: boolean
  glow?: boolean
  style?: CSSProperties
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function Button({ children, onClick, variant = 'primary', fullWidth, glow, style, disabled, type = 'button' }: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 16,
    fontWeight: 600,
    fontSize: 14,
    padding: '12px 24px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s',
  }

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: '#a3a3a3',
      color: '#0a0a0a',
      boxShadow: glow ? '0 0 20px rgba(163, 163, 163,0.3)' : 'none',
    },
    glass: {
      background: 'rgba(15, 21, 36, 0.6)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(163, 163, 163, 0.1)',
      color: '#e0e8f0',
    },
    ghost: {
      background: 'transparent',
      color: '#a3a3a3',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}


