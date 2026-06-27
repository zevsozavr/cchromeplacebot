import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#0a0e1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#e0e8f0', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}>error</span>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Щось пішло не так</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24, maxWidth: 280 }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{ padding: '12px 32px', borderRadius: 9999, background: '#a3a3a3', color: '#0a0a0a', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Спробувати знову
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

