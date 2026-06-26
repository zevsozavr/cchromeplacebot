import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Glass } from '../../components/Glass';
import { Icon } from '../../components/Icon';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

const defaultImages = [
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
  'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
  'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&q=80',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80',
];

export function AdminPhotos() {
  const navigate = useNavigate();
  const { products, updateProduct } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const handleChangePhoto = (productId: string) => {
    const current = products.find((p) => p.id === productId);
    if (!current) return;
    const nextIdx = defaultImages.findIndex((u) => u === current.image) + 1;
    const nextImage = defaultImages[nextIdx % defaultImages.length];
    updateProduct(productId, { image: nextImage });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.photos.title')} onBack={() => navigate('/admin')} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10, paddingBottom: 96 }}>
        <p style={{ font: 'var(--font-label)', color: 'var(--on-surface-variant)', marginBottom: 16 }}>{t('admin.photos.hint')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map((p) => (
            <Glass key={p.id} glow style={{ borderRadius: 'var(--rounded-lg)', padding: 12, cursor: 'pointer' }} onClick={() => handleChangePhoto(p.id)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 80, height: 100, borderRadius: 'var(--rounded-md)',
                  overflow: 'hidden', flexShrink: 0, background: 'var(--surface-low)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ font: 'var(--font-body)', fontWeight: 600 }}>{p.name}</p>
                  <p style={{ font: 'var(--font-label)', color: 'var(--on-surface-variant)', marginTop: 4 }}>{t('admin.photos.tap')}</p>
                </div>
                <Icon name="sync" style={{ color: 'var(--primary)' }} />
              </div>
            </Glass>
          ))}
        </div>
      </main>
    </div>
  );
}
