import { useState, useEffect } from 'react';
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

  const [senderPhone, setSenderPhone] = useState(npConfig?.senderPhone || '');

  // City search
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<{ ref: string; name: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<{ ref: string; name: string } | null>(null);
  const [cityOpen, setCityOpen] = useState(false);

  // Warehouse search
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouses, setWarehouses] = useState<{ ref: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ ref: string; name: string } | null>(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load existing config into selectors on mount
  useEffect(() => {
    if (npConfig?.citySenderRef && npConfig?.senderAddressRef) {
      // Ref values already set — show placeholder text
      setCityQuery(t('admin.np.configured'));
      setWarehouseQuery(t('admin.np.configured'));
    }
  }, []);

  // Debounced city search
  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/np-cities?q=${encodeURIComponent(cityQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setCities(data);
          setCityOpen(true);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Debounced warehouse search
  useEffect(() => {
    if (!selectedCity) { setWarehouses([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/np-warehouses?cityRef=${selectedCity.ref}&q=${encodeURIComponent(warehouseQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data);
          setWarehouseOpen(true);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [warehouseQuery, selectedCity]);

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const selectCity = (c: { ref: string; name: string }) => {
    setSelectedCity(c);
    setCityQuery(c.name);
    setCityOpen(false);
    setSelectedWarehouse(null);
    setWarehouseQuery('');
  };

  const selectWarehouse = (w: { ref: string; name: string }) => {
    setSelectedWarehouse(w);
    setWarehouseQuery(w.name);
    setWarehouseOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setNpConfig({
      senderRef: selectedCity?.ref || npConfig?.senderRef || '',
      senderAddressRef: selectedWarehouse?.ref || npConfig?.senderAddressRef || '',
      contactSenderRef: selectedCity?.ref || npConfig?.contactSenderRef || '',
      citySenderRef: selectedCity?.ref || npConfig?.citySenderRef || '',
      senderPhone,
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await fetch('/api/np-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityRecipientRef: selectedCity?.ref || npConfig?.citySenderRef, weight: 0.5, declaredCost: 100 }),
      });
      if (res.ok) {
        setTestResult('✅ NP API connected');
      } else {
        const err = await res.json();
        setTestResult(`❌ ${err.error || 'Connection failed'}`);
      }
    } catch {
      setTestResult('❌ Network error');
    }
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

          <div style={labelStyle}>{t('admin.np.sender_phone')}</div>
          <input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)}
            placeholder="+380XXXXXXXXX" style={inputStyle} />

            <div style={labelStyle}>{t('admin.np.city') || 'City'}</div>
          <div style={{ position: 'relative' }}>
            <input
              value={cityQuery}
              onChange={(e) => { setCityQuery(e.target.value); if (selectedCity && e.target.value !== selectedCity.name) setSelectedCity(null) }}
              onFocus={() => setCityOpen(true)}
              onBlur={() => setTimeout(() => setCityOpen(false), 250)}
              placeholder={t('checkout.placeholder.city')}
              style={inputStyle}
            />
            {cityOpen && cities.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: '#1a2438', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto',
              }}>
                {cities.map((c) => (
                  <button key={c.ref} type="button" onClick={() => selectCity(c)}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', color: '#e0e8f0', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

            <div style={labelStyle}>{t('admin.np.warehouse') || 'Warehouse'}</div>
          <div style={{ position: 'relative' }}>
            <input
              value={warehouseQuery}
              onChange={(e) => { setWarehouseQuery(e.target.value); if (selectedWarehouse && e.target.value !== selectedWarehouse.name) setSelectedWarehouse(null) }}
              onFocus={() => setWarehouseOpen(true)}
              onBlur={() => setTimeout(() => setWarehouseOpen(false), 250)}
              placeholder={t('checkout.placeholder.warehouse')}
              style={inputStyle}
              disabled={!selectedCity && !npConfig?.citySenderRef}
            />
            {warehouseOpen && warehouses.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: '#1a2438', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto',
              }}>
                {warehouses.map((w) => (
                  <button key={w.ref} type="button" onClick={() => selectWarehouse(w)}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', color: '#e0e8f0', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button fullWidth glow variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? t('admin.np.saving') : saved ? t('admin.np.saved') : t('admin.np.save')}
            </Button>
            <Button fullWidth variant="glass" onClick={handleTest}>{t('admin.np.test')}</Button>
            <Button fullWidth variant="glass" onClick={() => navigate('/admin')}>{t('admin.cancel')}</Button>
          </div>

          {testResult && (
            <p style={{ fontSize: 13, textAlign: 'center', marginTop: 4 }}>{testResult}</p>
          )}
        </Glass>
      </main>
    </div>
  );
}
