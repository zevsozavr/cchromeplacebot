import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Glass } from '../../components/Glass';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
  backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  font: 'var(--font-label)', color: '#9ca3af', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 8, display: 'block',
};

export function AdminNovaPoshta() {
  const navigate = useNavigate();
  const { npConfig, setNpConfig } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();

  const [config, setConfig] = useState({
    senderRef: npConfig?.senderRef || '',
    senderAddressRef: npConfig?.senderAddressRef || '',
    contactSenderRef: npConfig?.contactSenderRef || '',
    citySenderRef: npConfig?.citySenderRef || '',
    senderPhone: npConfig?.senderPhone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const handleSave = async () => {
    setSaving(true);
    setNpConfig(config);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.np.title')} onBack={() => navigate('/admin')} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)' }}>
        <Glass card glow style={{ borderRadius: 'var(--rounded-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4, color: '#22c55e' }}>
            {t('admin.np.title')}
          </h3>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>{t('admin.np.hint')}</p>

          <div style={labelStyle}>{t('admin.np.sender_ref')}</div>
          <input value={config.senderRef} onChange={(e) => setConfig({ ...config, senderRef: e.target.value })}
            placeholder="Counterparty Ref (Sender)" style={inputStyle} />

          <div style={labelStyle}>{t('admin.np.sender_address_ref')}</div>
          <input value={config.senderAddressRef} onChange={(e) => setConfig({ ...config, senderAddressRef: e.target.value })}
            placeholder="Sender Address Ref" style={inputStyle} />

          <div style={labelStyle}>{t('admin.np.contact_sender_ref')}</div>
          <input value={config.contactSenderRef} onChange={(e) => setConfig({ ...config, contactSenderRef: e.target.value })}
            placeholder="Contact Sender Ref" style={inputStyle} />

          <div style={labelStyle}>{t('admin.np.city_sender_ref')}</div>
          <input value={config.citySenderRef} onChange={(e) => setConfig({ ...config, citySenderRef: e.target.value })}
            placeholder="City Sender Ref (Kyiv, etc.)" style={inputStyle} />

          <div style={labelStyle}>{t('admin.np.sender_phone')}</div>
          <input value={config.senderPhone} onChange={(e) => setConfig({ ...config, senderPhone: e.target.value })}
            placeholder="+380XXXXXXXXX" style={inputStyle} />

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button fullWidth glow variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? t('admin.np.saving') : saved ? t('admin.np.saved') : t('admin.np.save')}
            </Button>
            <Button fullWidth variant="glass" onClick={() => navigate('/admin')}>{t('admin.cancel')}</Button>
          </div>
        </Glass>
      </main>
    </div>
  );
}
