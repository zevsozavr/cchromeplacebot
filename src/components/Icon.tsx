import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  style?: CSSProperties
  className?: string
}

export function Icon({ name, style, className = '' }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 20, ...style }}>
      {name}
    </span>
  )
}
