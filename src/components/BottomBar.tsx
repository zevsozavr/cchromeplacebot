import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'

const tabs = [
  { icon: 'storefront', key: 'nav.store', path: '/' },
  { icon: 'local_mall', key: 'nav.cart', path: '/cart' },
  { icon: 'favorite', key: 'nav.favorites', path: '/favorites' },
  { icon: 'settings', key: 'nav.settings', path: '/settings' },
]

export function BottomBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 32px 24px',
        background: 'rgba(20, 28, 46, 0.3)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px 12px 0 0',
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname === tab.path || (tab.path === '/' && location.pathname === '/')
        return (
          <button
            key={tab.path}
            aria-label={t(tab.key)}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: active ? '#22c55e' : 'transparent',
              color: active ? '#001f2e' : '#a0b4c4',
              borderRadius: active ? '50%' : 0,
              transition: 'all 0.2s',
              boxShadow: active ? '0 0 15px rgba(123,209,250,0.3)' : 'none',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 24,
                fontVariationSettings: active ? "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
              }}
            >
              {tab.icon}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
