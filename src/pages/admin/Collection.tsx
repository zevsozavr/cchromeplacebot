import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Glass } from '../../components/Glass';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function AdminCollection() {
  const navigate = useNavigate();
  const { collection, setCollection } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enabled, setEnabled] = useState(collection.enabled);
  const [title, setTitle] = useState(collection.title);
  const [subtitle, setSubtitle] = useState(collection.subtitle);
  const [tag, setTag] = useState(collection.tag);
  const [image, setImage] = useState(collection.image);
  const [imageDataUrl, setImageDataUrl] = useState('');

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImageDataUrl(url);
      setImage(url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setCollection({ enabled, title, subtitle, tag, image: imageDataUrl || image });
    navigate('/admin');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.collection')} onBack={() => navigate('/admin')} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10 }}>
        <Glass card glow style={{ borderRadius: 'var(--rounded-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>{t('admin.collection')}</h3>

          <div onClick={() => setEnabled(!enabled)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', cursor: 'pointer' }}>
            <span style={{ font: 'var(--font-body)', color: 'var(--on-surface)' }}>{t('admin.collection.show')}</span>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? 'var(--primary)' : 'var(--surface-highest)', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: enabled ? 22 : 2, transition: 'left 0.2s' }} />
            </div>
          </div>

          {enabled && (
          <>
          <input placeholder={t('admin.collection.title')} value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
          <input placeholder={t('admin.collection.subtitle')} value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
          <input placeholder={t('admin.collection.tag')} value={tag} onChange={(e) => setTag(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />

          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange}
              style={{ width: '100%', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
            {!imageDataUrl && (
              <input placeholder={t('admin.product.photo.placeholder')} value={image} onChange={(e) => { setImage(e.target.value); setImageDataUrl(''); }}
                style={{ width: '100%', marginTop: 8, padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
            )}
            {(imageDataUrl || image) && (
              <div style={{ marginTop: 8, width: '100%', aspectRatio: '2/1', borderRadius: 'var(--rounded-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <img src={imageDataUrl || image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          </>)}
          <Button fullWidth glow variant="primary" onClick={handleSave}>{t('admin.collection.save')}</Button>
        </Glass>
      </main>
    </div>
  );
}
