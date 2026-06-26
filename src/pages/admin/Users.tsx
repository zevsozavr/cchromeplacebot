import { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Glass } from '../../components/Glass';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function AdminUsers() {
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch {}
  };

  useEffect(() => { fetchUsers(); }, []);

  const applyDeal = async (phone: string) => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, discountPercent: Number(discount), note }),
    });
    setDiscount(''); setNote(''); setSelectedPhone(null);
    fetchUsers();
  };

  const removeDeal = async (phone: string) => {
    await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });
    fetchUsers();
  };

  if (!isAdmin) {
    return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
      <p>{t('admin.access.denied')}</p>
    </div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.users')} onBack={() => window.history.back()} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10 }}>
        <h2 style={{ font: 'var(--font-headline)', marginBottom: 20 }}>{t('admin.users')} ({users.length})</h2>
        {users.length === 0 && (
          <p style={{ color: 'var(--on-surface-variant)', textAlign: 'center', paddingTop: 40 }}>{t('settings.no.orders')}</p>
        )}
        {users.map((u) => (
          <Glass key={u.phone} style={{ borderRadius: 'var(--rounded-lg)', padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 14 }}>{u.name}</span>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{u.phone}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 8 }}>
              <span>{t('admin.orders')}: {u.orders.length} | {t('cart.total')}: ₴{u.totalSpent.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12, marginBottom: 8, maxHeight: 100, overflow: 'auto' }}>
              {u.orders.map((o: any) => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', marginBottom: 2 }}>
                  <span>#{o.id} ({o.items?.length || 0} items) — {o.status}</span>
                  <span>₴{o.total?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {u.deal ? (
                <div style={{ fontSize: 12, color: '#22c55e', flex: 1 }}>
                  {t('admin.deal.active')}: {u.deal.discountPercent}% {u.deal.note && `— ${u.deal.note}`}
                  <button onClick={() => removeDeal(u.phone)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                    {t('admin.deal.remove')}
                  </button>
                </div>
              ) : selectedPhone === u.phone ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <input placeholder="%" value={discount} onChange={(e) => setDiscount(e.target.value)} type="number"
                    style={{ width: 48, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e8f0', fontSize: 12, outline: 'none' }} />
                  <input placeholder={t('admin.deal.note')} value={note} onChange={(e) => setNote(e.target.value)}
                    style={{ flex: 1, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e8f0', fontSize: 12, outline: 'none' }} />
                  <button onClick={() => applyDeal(u.phone)} style={{ padding: '4px 12px', borderRadius: 999, background: '#22c55e', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                    {t('admin.collection.save')}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setSelectedPhone(u.phone); setDiscount(''); setNote(''); }} style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 12, cursor: 'pointer' }}>
                  {t('admin.deal.add')}
                </button>
              )}
            </div>
          </Glass>
        ))}
      </main>
    </div>
  );
}
