import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Glass } from '../../components/Glass';
import { Icon } from '../../components/Icon';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { processAndUploadImage } from '../../lib/image';

const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];


const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
};
const labelStyle: React.CSSProperties = {
  font: 'var(--font-label)', color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)',
  boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3e%3cpath d=\'M6 9l6 6 6-6\'/%3e%3c/svg%3e")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};
const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, fontWeight: 500,
  border: active ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(34,197,94,0.15)' : 'transparent',
  color: active ? '#22c55e' : '#a0b4c4',
  transition: 'all 0.12s',
});
const chipGroupStyle: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8,
};

export function AdminProducts() {
  const navigate = useNavigate();
  const { products, categories, addProduct, updateProduct, deleteProduct, saving } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L']);
  const [customSize, setCustomSize] = useState('');
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({ 'S': 5, 'M': 5, 'L': 5 });
  const [uploading, setUploading] = useState(false);

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Compress + upload each photo to storage; store the returned hosted URLs
      // (not base64) so the saved product stays small and persists reliably.
      const urls = await Promise.all(Array.from(files).map((f) => processAndUploadImage(f)));
      setImageDataUrls((prev) => [...prev, ...urls.filter(Boolean)]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImageDataUrl = (index: number) => {
    setImageDataUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) {
        const newStock = { ...sizeStock };
        delete newStock[size];
        setSizeStock(newStock);
        return prev.filter((s) => s !== size);
      }
      setSizeStock((s) => ({ ...s, [size]: 5 }));
      return [...prev, size];
    });
  };

  const addCustomSize = () => {
    const s = customSize.trim();
    if (s && !selectedSizes.includes(s)) {
      setSelectedSizes((prev) => [...prev, s]);
      setSizeStock((prev) => ({ ...prev, [s]: 5 }));
    }
    setCustomSize('');
  };

  const resetForm = () => {
    setName(''); setCategory(''); setNewCategory(''); setSubcategory(''); setPrice('');
    setImageDataUrls([]); setDescription(''); setCondition('New');
    setSelectedSizes(['S', 'M', 'L']); setCustomSize('');
    setSizeStock({ 'S': 5, 'M': 5, 'L': 5 });
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (p: typeof products[0]) => {
    setEditingId(p.id);
    setName(p.name); setCategory(p.category); setPrice(String(p.price));
    setSubcategory(p.subcategory || '');
    setImageDataUrls(p.images?.length ? p.images : (p.image ? [p.image] : []));
    setDescription(p.description || '');
    setCondition(p.condition || 'New');
    setSelectedSizes(p.sizes || ['One Size']);
    setSizeStock(p.sizeStock || Object.fromEntries((p.sizes || ['One Size']).map((s) => [s, p.stock ?? 5])));
    setShowForm(true);
  };

  const getFinalImages = (): string[] => imageDataUrls.filter(Boolean);

  const handleAdd = async () => {
    if (!name || !price || saving || uploading) return;
    const cat = category || newCategory || 'General';
    const productData = {
      name, category: cat, subcategory: subcategory || undefined,
      price: Number(price),
      image: getFinalImages()[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a11?w=400&q=80',
      images: getFinalImages().length > 0 ? getFinalImages() : undefined,
      description: description || '', condition,
      sizes: selectedSizes.length > 0 ? selectedSizes : ['One Size'],
      sizeStock,
    };
    // Wait for the DB write to finish before closing the form, so the product
    // is guaranteed persisted even if the user closes the app immediately after.
    if (editingId) {
      await updateProduct(editingId, productData);
    } else {
      await addProduct({ id: Date.now().toString(), ...productData });
    }
    resetForm();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Header showBack title={t('admin.products')} onBack={() => navigate('/admin')} />
      <main style={{ flex: 1, overflow: 'auto', padding: '20px var(--pad)', position: 'relative', zIndex: 10, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ font: 'var(--font-label)', color: 'var(--on-surface-variant)' }}>{products.length} {t('products.count')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="glass" onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ padding: '10px 20px', fontWeight: 600 }}>
              <Icon name="add" style={{ fontSize: 18 }} /> {t('admin.add.product')}
            </Button>
          </div>
        </div>

        {showForm && (
          <Glass card glow style={{ borderRadius: 'var(--rounded-lg)', padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: '#22c55e', fontSize: 14 }}>
                <Icon name={editingId ? 'edit' : 'add'} style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }} />
                {editingId ? t('admin.product.save') : t('admin.add.product')}
              </span>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Section: Basic Info */}
            <div style={sectionStyle}>
              <span style={labelStyle}>{t('admin.form.basic_info')}</span>
              <input placeholder={t('admin.product.name')} value={name} onChange={(e) => setName(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={category} onChange={(e) => { setCategory(e.target.value); if (e.target.value !== '__new__') setNewCategory(''); }}
                  style={{ ...selectStyle, flex: 1 }}>
                  <option value="">— {t('admin.product.category')} —</option>
                  {categories.filter((c) => c.name !== 'All').map((c) => (
                    <option key={c.id} value={c.name}>{t('categories.' + c.name) || c.name}</option>
                  ))}
                  <option value="__new__">+ {t('admin.product.category')}...</option>
                </select>
                {category && category !== '__new__' && (
                  <input placeholder={t('admin.product.subcategory')} value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }} />
                )}
              </div>
              {category === '__new__' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input placeholder={t('admin.product.category')} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }} />
                  <input placeholder={t('admin.product.subcategory')} value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
              )}
            </div>

            {/* Section: Pricing & Stock */}
            <div style={sectionStyle}>
              <span style={labelStyle}>{t('admin.form.pricing')}</span>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input placeholder={t('admin.product.price')} type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>

            {/* Section: Photos */}
            <div style={sectionStyle}>
              <span style={labelStyle}>{t('admin.product.photos')} <span style={{ color: '#6b7280', fontWeight: 400, textTransform: 'none' }}>({t('admin.form.first_is_primary')})</span></span>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(34,197,94,0.3)',
                  borderRadius: 16,
                  padding: '32px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(34,197,94,0.03)',
                  transition: 'background 0.15s',
                  marginBottom: imageDataUrls.length > 0 ? 12 : 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.03)'}
              >
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} style={{ display: 'none' }} />
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#22c55e', marginBottom: 8, display: 'block' }}>{uploading ? 'progress_activity' : 'add_photo_alternate'}</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', margin: 0 }}>{uploading ? '...' : t('admin.form.upload')}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>PNG, JPG — до 10 фото</p>
              </div>

              {imageDataUrls.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {imageDataUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 12, overflow: 'hidden', border: i === 0 ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.08)', background: '#0f1524' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => removeImageDataUrl(i)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          border: 'none', color: '#fff', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0, fontSize: 16,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                      {i === 0 && (
                        <span style={{
                          position: 'absolute', bottom: 4, left: 4,
                          fontSize: 9, fontWeight: 700,
                          background: '#22c55e', color: '#001f2e',
                          padding: '1px 6px', borderRadius: 6,
                        }}>{t('admin.form.primary')}</span>
                      )}
                      {imageDataUrls.length > 1 && i > 0 && (
                        <div style={{
                          position: 'absolute', top: 4, left: 4,
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(4px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#fff',
                        }}>{i + 1}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Details */}
            <div style={sectionStyle}>
              <span style={labelStyle}>{t('admin.form.details')}</span>

              <select value={condition} onChange={(e) => setCondition(e.target.value)}
                style={{ ...selectStyle, marginBottom: 12 }}>
                <option value="New">{t('product.condition.new')}</option>
                <option value="Like New">{t('product.condition.like_new')}</option>
                <option value="Good">{t('product.condition.good')}</option>
                <option value="Fair">{t('product.condition.fair')}</option>
              </select>

              {/* Sizes as toggle chips */}
              <span style={{ ...labelStyle, marginTop: 8 }}>{t('admin.product.sizes_label')}</span>
              <div style={chipGroupStyle}>
                {commonSizes.map((s) => (
                  <button key={s} onClick={() => toggleSize(s)} style={chipStyle(selectedSizes.includes(s))}>
                    {selectedSizes.includes(s) && <span style={{ marginRight: 4 }}>✓</span>}{s}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                <input placeholder={t('admin.form.custom_size')} value={customSize} onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                  style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }} />
                <button onClick={addCustomSize} style={{ padding: '8px 14px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: '#22c55e', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>{t('admin.form.add')}</button>
              </div>

              {/* Per-size stock */}
              {selectedSizes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {selectedSizes.map((s) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--rounded-md)', padding: '4px 8px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e8f0', minWidth: 24 }}>{s}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <button onClick={() => setSizeStock((prev) => ({ ...prev, [s]: Math.max(0, (prev[s] ?? 5) - 1) }))} style={{ width: 24, height: 28, border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 14 }}>−</button>
                        <input type="number" value={sizeStock[s] ?? 5} onChange={(e) => setSizeStock((prev) => ({ ...prev, [s]: Math.max(0, Number(e.target.value)) }))} style={{ width: 36, textAlign: 'center', border: 'none', background: 'transparent', color: '#e0e8f0', fontSize: 13, fontWeight: 600, padding: 0, outline: 'none', MozAppearance: 'textfield' }} />
                        <button onClick={() => setSizeStock((prev) => ({ ...prev, [s]: (prev[s] ?? 5) + 1 }))} style={{ width: 24, height: 28, border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 14 }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <textarea placeholder={t('admin.product.description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical', marginBottom: 4 }} />
            </div>

            <Button fullWidth glow variant="primary" onClick={handleAdd} disabled={saving || uploading}>
              {saving || uploading ? '…' : (editingId ? t('admin.product.save') : t('admin.product.add'))}
            </Button>
          </Glass>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map((p) => (
            <Glass key={p.id} style={{ borderRadius: 'var(--rounded-lg)', padding: 16, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
              onClick={() => openEdit(p)}>
              <div style={{ width: 56, height: 72, borderRadius: 'var(--rounded-md)', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-low)', position: 'relative' }}>
                <img src={p.images?.[0] || p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.images && p.images.length > 1 && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0 4px', borderRadius: 4 }}>
                    +{p.images.length - 1}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ font: 'var(--font-body)', fontWeight: 600 }}>{p.name}</p>
                <p style={{ font: 'var(--font-label)', color: 'var(--on-surface-variant)', fontSize: 12 }}>
                  {t('categories.' + p.category) || p.category} {p.subcategory && `› ${p.subcategory}`} — {p.price.toLocaleString()}₴
                  <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>{t('product.condition.' + p.condition.toLowerCase().replace(/\s+/g, '_'))}</span>
                </p>
                {p.description && <p style={{ font: 'var(--font-body)', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.description}</p>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} style={{ color: 'var(--error)', cursor: 'pointer', padding: 4 }}>
                <Icon name="delete" />
              </button>
            </Glass>
          ))}
          {products.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              <p style={{ fontSize: 14 }}>{t('admin.no.products')}</p>
            </div>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              position: 'fixed', bottom: 88, right: 24,
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
          </button>
        )}
      </main>
    </div>
  );
}
