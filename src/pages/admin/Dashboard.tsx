import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Glass } from '../../components/Glass';
import { Icon } from '../../components/Icon';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { products } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
        <p>{t('admin.access.denied')}</p>
      </div>
    );
  }

  const cards = [
    { label: t('admin.products'), value: products.length, icon: 'inventory_2', path: '/admin/products', color: '#a3a3a3' },
    { label: t('admin.np.title'), value: '', icon: 'local_shipping', path: '/admin/nova-poshta', color: '#06b6d4' },
    { label: t('admin.orders'), value: '', icon: 'receipt_long', path: '/admin/orders', color: '#a3a3a3' },
    { label: t('admin.users'), value: '', icon: 'people', path: '/admin/users', color: '#a3a3a3' },
    { label: t('admin.data'), value: '', icon: 'delete_sweep', path: '/admin/data', color: '#ff6b6b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.title')} onBack={() => navigate('/settings')} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10 }}>
        <h2 style={{ font: 'var(--font-headline)', marginBottom: 20 }}>{t('admin.dashboard')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {cards.map((card) => (
            <Glass key={card.path} glow style={{ borderRadius: 'var(--rounded-lg)', padding: 20, cursor: 'pointer' }}
              onClick={() => navigate(card.path)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name={card.icon} style={{ color: card.color, fontSize: 28 }} />
                  <span style={{ font: 'var(--font-body)' }}>{card.label}</span>
                </div>
                {card.value !== '' && <span style={{ font: 'var(--font-display)', color: card.color, fontSize: 28 }}>{card.value}</span>}
                {card.value === '' && <Icon name="chevron_right" style={{ color: 'var(--on-surface-variant)' }} />}
              </div>
            </Glass>
          ))}
        </div>
      </main>
    </div>
  );
}

