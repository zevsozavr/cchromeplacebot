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
const dropdownStyle: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
  background: '#1a2438', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto',
};
const dropdownItemStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none',
  border: 'none', color: '#e0e8f0', cursor: 'pointer', fontSize: 13,
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

type Sender = { ref: string; name: string; cityRef: string; cityName: string };
type Contact = { ref: string; name: string; phone: string };
type City = { ref: string; name: string };
type Warehouse = { ref: string; name: string };

export function AdminNovaPoshta() {
  const navigate = useNavigate();
  const { npConfig, setNpConfig } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();

  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSender, setSelectedSender] = useState<Sender | null>(null);
  const [senderOpen, setSenderOpen] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  // City for the sending warehouse (may differ from sender's city field if NP left it blank)
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityOpen, setCityOpen] = useState(false);

  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load senders on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/create-shipment')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setSenders(data.senders || []);
        if (npConfig?.senderRef && data.senders) {
          const s = data.senders.find((s: Sender) => s.ref === npConfig.senderRef);
          if (s) setSelectedSender(s);
        }
      })
      .catch(() => setError('Failed to load senders'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch contacts when sender selected
  useEffect(() => {
    if (!selectedSender) { setContacts([]); setSelectedContact(null); return; }
    fetch(`/api/create-shipment?senderRef=${selectedSender.ref}`)
      .then((r) => r.json())
      .then((data) => {
        setContacts(data.contacts || []);
        if (npConfig?.contactSenderRef && data.contacts) {
          const c = data.contacts.find((c: Contact) => c.ref === npConfig.contactSenderRef);
          if (c) setSelectedContact(c);
        }
      })
      .catch(() => {});
  }, [selectedSender]);

  // Debounced city search
  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/np-cities?q=${encodeURIComponent(cityQuery)}`)
        .then((r) => r.json())
        .then((data) => { setCities(data || []); setCityOpen(true); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Fetch warehouses when city selected
  useEffect(() => {
    if (!selectedCity) { setWarehouses([]); return; }
    fetch(`/api/np-warehouses?cityRef=${selectedCity.ref}&q=${encodeURIComponent(warehouseQuery)}`)
      .then((r) => r.json())
      .then((data) => { setWarehouses(data || []); setWarehouseOpen(true); })
      .catch(() => {});
  }, [warehouseQuery, selectedCity]);

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const handleSave = async () => {
    if (!selectedSender || !selectedContact || !selectedCity || !selectedWarehouse) {
      setError('Оберіть відправника, контакт, місто та відділення');
      return;
    }
    setSaving(true);
    setNpConfig({
      senderRef: selectedSender.ref,
      contactSenderRef: selectedContact.ref,
      senderAddressRef: selectedWarehouse.ref,
      citySenderRef: selectedCity.ref,
      senderPhone: selectedContact.phone,
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await fetch('/api/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityRef: selectedCity?.ref || npConfig?.citySenderRef,
          warehouseRef: selectedWarehouse?.ref || npConfig?.senderAddressRef,
          recipientName: 'Тест Отримувач',
          recipientPhone: '+380000000000',
          declaredCost: 100,
          afterpayAmount: 100,
          weight: 0.5,
          prepay: false,
          description: 'одяг',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ttn) {
        setTestResult(`✅ TTN: ${data.ttn}`);
      } else {
        setTestResult(`❌ ${data.error || 'Failed'}`);
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
          <h3 style={{ font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4, color: '#a3a3a3' }}>
            {t('admin.np.title')}
          </h3>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Отримайте ці дані в особистому кабінеті Nova Poshta (API → Налаштування відправника). Обов'язкові для автоматичного створення ТТН.</p>

          {loading && <p style={{ fontSize: 13, color: '#9ca3af' }}>Завантаження відправників…</p>}
          {error && <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>}

          {/* Sender */}
          <div>
            <span style={labelStyle}>Відправник (з NP особистого кабінету)</span>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setSenderOpen((o) => !o)}
                style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'block' }}>
                {selectedSender ? selectedSender.name : '— оберіть відправника —'}
              </button>
              {senderOpen && senders.length > 0 && (
                <div style={dropdownStyle}>
                  {senders.map((s) => (
                    <button key={s.ref} type="button"
                      onClick={() => { setSelectedSender(s); setSenderOpen(false); setSelectedContact(null); setSelectedCity(null); setCityQuery(''); setSelectedWarehouse(null); setWarehouseQuery(''); }}
                      style={dropdownItemStyle}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact person */}
          {contacts.length > 0 && (
            <div>
              <span style={labelStyle}>Контактна особа відправника</span>
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setContactOpen((o) => !o)}
                  style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'block' }}>
                  {selectedContact ? `${selectedContact.name} ${selectedContact.phone}` : '— оберіть контакт —'}
                </button>
                {contactOpen && (
                  <div style={dropdownStyle}>
                    {contacts.map((c) => (
                      <button key={c.ref} type="button"
                        onClick={() => { setSelectedContact(c); setContactOpen(false); }}
                        style={dropdownItemStyle}>
                        {c.name} {c.phone}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* City of sending warehouse */}
          {selectedSender && (
            <div>
              <span style={labelStyle}>Місто відділення відправника</span>
              <div style={{ position: 'relative' }}>
                <input
                  value={cityQuery}
                  onChange={(e) => { setCityQuery(e.target.value); if (selectedCity) { setSelectedCity(null); setSelectedWarehouse(null); setWarehouseQuery(''); } }}
                  onFocus={() => setCityOpen(true)}
                  onBlur={() => setTimeout(() => setCityOpen(false), 250)}
                  placeholder="Введіть місто…"
                  style={inputStyle}
                />
                {cityOpen && cities.length > 0 && (
                  <div style={dropdownStyle}>
                    {cities.map((c) => (
                      <button key={c.ref} type="button"
                        onClick={() => { setSelectedCity(c); setCityQuery(c.name); setCityOpen(false); setSelectedWarehouse(null); setWarehouseQuery(''); }}
                        style={dropdownItemStyle}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warehouse */}
          {selectedCity && (
            <div>
              <span style={labelStyle}>Відділення відправлення</span>
              <div style={{ position: 'relative' }}>
                <input
                  value={warehouseQuery}
                  onChange={(e) => { setWarehouseQuery(e.target.value); if (selectedWarehouse) setSelectedWarehouse(null); }}
                  onFocus={() => setWarehouseOpen(true)}
                  onBlur={() => setTimeout(() => setWarehouseOpen(false), 250)}
                  placeholder="Пошук відділення…"
                  style={inputStyle}
                />
                {warehouseOpen && warehouses.length > 0 && (
                  <div style={dropdownStyle}>
                    {warehouses.map((w) => (
                      <button key={w.ref} type="button"
                        onClick={() => { setSelectedWarehouse(w); setWarehouseQuery(w.name); setWarehouseOpen(false); }}
                        style={dropdownItemStyle}>
                        {w.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved config summary */}
          {npConfig?.senderRef && (
            <div style={{ fontSize: 12, color: '#6b7280', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8 }}>
              <div>✓ Sender ref: {npConfig.senderRef.slice(0, 8)}…</div>
              <div>✓ Contact ref: {npConfig.contactSenderRef?.slice(0, 8)}…</div>
              <div>✓ Warehouse ref: {npConfig.senderAddressRef?.slice(0, 8)}…</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button fullWidth glow variant="primary" onClick={handleSave}
              disabled={saving || !selectedSender || !selectedContact || !selectedCity || !selectedWarehouse}>
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

