import { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Glass } from '../../components/Glass';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import type { Order } from '../../types';

export function AdminOrders() {
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    const updated = orders.map((o) => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
  };

  const confirmPrepay = async (id: string) => {
    await updateStatus(id, 'processing');
    try {
      const order = orders.find((o) => o.id === id);
      if (order) {
        const msg = `✅ *Передплату підтверджено!*\n\nЗамовлення #${order.id} перейшло в обробку. ТТН: ${order.ttn || '—'}`;
        const adminIds = [7264276513, 822479618];
        await Promise.allSettled(adminIds.map((chat_id) =>
          fetch(`https://api.telegram.org/bot8962788106:AAHRlKbCNCHe4nW47PmKJkQeMzDIc7GpDZ0/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text: msg, parse_mode: 'Markdown' }),
          })
        ));
      }
    } catch {}
  };

  const deleteOrder = async (id: string) => {
    const filtered = orders.filter((o) => o.id !== id);
    setOrders(filtered);
    try {
      await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
    } catch {}
  };

  if (!isAdmin) {
    return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
      <p>{t('admin.access.denied')}</p>
    </div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.orders')} onBack={() => window.history.back()} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10 }}>
        <h2 style={{ font: 'var(--font-headline)', marginBottom: 20 }}>{t('admin.orders')} ({orders.length})</h2>
        {loading && <p style={{ textAlign: 'center', color: '#9ca3af', paddingTop: 40 }}>{t('checkout.processing')}</p>}
        {!loading && orders.length === 0 && (
          <p style={{ color: 'var(--on-surface-variant)', textAlign: 'center', paddingTop: 40 }}>{t('settings.no.orders')}</p>
        )}
        {[...orders].reverse().map((o) => (
          <Glass key={o.id} style={{ borderRadius: 'var(--rounded-lg)', padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>#{o.id}</span>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                {new Date(o.date).toLocaleDateString()} {new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 8 }}>
              <div>{o.name} — {o.phone}</div>
              <div>{o.address}</div>
            </div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              {o.items.map((item) => (
                <div key={item.name + item.selectedSize} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface)', marginBottom: 2 }}>
                  <span>{item.name} x{item.quantity} ({item.selectedSize})</span>
                  <span>₴{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t('cart.total')}</span>
              <span style={{ fontWeight: 700, color: '#22c55e' }}>₴{o.total.toLocaleString()}</span>
            </div>
            {o.ttn && (
              <div style={{ marginBottom: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                📦 TTN: {o.ttn}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value as Order['status'])}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e0e8f0', fontSize: 12, outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="new">{t('order.step.confirmed')}</option>
                <option value="awaiting-payment">🕐 Очікує оплату</option>
                <option value="processing">{t('order.step.processing')}</option>
                <option value="shipped">{t('order.step.shipped')}</option>
                <option value="delivered">{t('order.step.delivered')}</option>
              </select>
              {o.status === 'awaiting-payment' && (
                <button
                  onClick={() => confirmPrepay(o.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 9999,
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#22c55e', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  ✅ Кошти отримано
                </button>
              )}
              <button
                onClick={() => deleteOrder(o.id)}
                style={{
                  padding: '8px 16px', borderRadius: 9999,
                  background: 'rgba(255, 107, 107, 0.15)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  color: '#ff6b6b', fontSize: 12, cursor: 'pointer',
                }}
              >
                {t('admin.order.delete')}
              </button>
            </div>
          </Glass>
        ))}
      </main>
    </div>
  );
}
