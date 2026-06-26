import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Glass } from '../../components/Glass';
import { Icon } from '../../components/Icon';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function AdminProducts() {
  const navigate = useNavigate();
  const { products, categories, addProduct, updateProduct, deleteProduct } = useData();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [price, setPrice] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [sizesInput, setSizesInput] = useState('S, M, L');
  const [colorsInput, setColorsInput] = useState('Default:#000000');
  const [inCollection, setInCollection] = useState(false);
  const [collectionsInput, setCollectionsInput] = useState('');
  const [stock, setStock] = useState('5');

  if (!isAdmin) return <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}><p>{t('admin.access.denied')}</p></div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setName(''); setCategory(''); setNewCategory(''); setPrice('');
    setImageDataUrl(''); setImageUrl(''); setDescription(''); setCondition('New');
    setSizesInput('S, M, L'); setColorsInput('Default:#000000'); setInCollection(false); setCollectionsInput(''); setStock('5');
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (p: typeof products[0]) => {
    setEditingId(p.id);
    setName(p.name); setCategory(p.category); setPrice(String(p.price));
    setImageUrl(p.image); setImageDataUrl(''); setDescription(p.description);
    setCondition(p.condition);
    setSizesInput(p.sizes.join(', '));
    setColorsInput(p.colors.map((c) => `${c.name}:${c.hex}`).join(', '));
    setInCollection(p.inCollection || false);
    setCollectionsInput(p.collections ? p.collections.join(', ') : '');
    setStock(String(p.stock ?? 5));
    setShowForm(true);
  };

  const parseColors = (input: string) => {
    return input.split(',').map((c) => {
      const parts = c.trim().split(':');
      return { name: parts[0]?.trim() || 'Default', hex: parts[1]?.trim() || '#000000' };
    });
  };

  const handleAdd = () => {
    if (!name || !price) return;
    const cat = category || newCategory || 'General';
    const parsedSizes = sizesInput.split(',').map((s) => s.trim()).filter(Boolean);
    const parsedColors = parseColors(colorsInput);
    const productData = {
      name, category: cat, price: Number(price),
      image: imageDataUrl || imageUrl || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a11?w=400&q=80',
      description: description || '', condition,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['One Size'],
      colors: parsedColors,
      inCollection,
      collections: collectionsInput.split(',').map((s) => s.trim()).filter(Boolean),
      stock: Number(stock),
    };
    if (editingId) {
      updateProduct(editingId, productData);
    } else {
      addProduct({ id: Date.now().toString(), ...productData });
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
          <Glass card glow style={{ borderRadius: 'var(--rounded-lg)', padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#22c55e', fontSize: 14 }}>{editingId ? t('admin.product.save') : t('admin.add.product')}</span>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <input placeholder={t('admin.product.name')} value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />

            <select value={category} onChange={(e) => { setCategory(e.target.value); if (e.target.value !== '__new__') setNewCategory(''); }}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }}>
              <option value="">— {t('admin.product.category')} —</option>
              {categories.filter((c) => c.name !== 'All').map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="__new__">+ {t('admin.product.category')}...</option>
            </select>

            {category === '__new__' && (
              <input placeholder={t('admin.product.category')} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <input placeholder={t('admin.product.price')} type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
              <input placeholder={t('admin.product.stock')} type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                style={{ width: 80, padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
            </div>

            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange}
                style={{ width: '100%', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
              {!imageDataUrl && (
                <input placeholder={t('admin.product.photo.placeholder')} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  style={{ width: '100%', marginTop: 8, padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />
              )}
              {imageDataUrl && (
                <div style={{ marginTop: 8, width: 80, height: 100, borderRadius: 'var(--rounded-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <img src={imageDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <select value={condition} onChange={(e) => setCondition(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }}>
              <option value="New">{t('product.condition.new')}</option>
              <option value="Like New">{t('product.condition.like_new')}</option>
              <option value="Good">{t('product.condition.good')}</option>
              <option value="Fair">{t('product.condition.fair')}</option>
            </select>

            <input placeholder={t('admin.product.sizes')} value={sizesInput} onChange={(e) => setSizesInput(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />

            <input placeholder={t('admin.product.colors')} value={colorsInput} onChange={(e) => setColorsInput(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />

            <input placeholder={t('admin.product.collections')} value={collectionsInput} onChange={(e) => setCollectionsInput(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)' }} />

            <textarea placeholder={t('admin.product.description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', font: 'var(--font-body)', color: 'var(--on-surface)', resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--font-body)', color: 'var(--on-surface)', cursor: 'pointer' }}>
              <input type="checkbox" checked={inCollection} onChange={(e) => setInCollection(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
              {t('admin.product.in_collection')}
            </label>
            <Button fullWidth glow variant="primary" onClick={handleAdd}>
              {editingId ? t('admin.product.save') : t('admin.product.add')}
            </Button>
          </Glass>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map((p) => (
            <Glass key={p.id} style={{ borderRadius: 'var(--rounded-lg)', padding: 16, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
              onClick={() => openEdit(p)}>
              <div style={{ width: 56, height: 72, borderRadius: 'var(--rounded-md)', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-low)' }}>
                <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ font: 'var(--font-body)', fontWeight: 600 }}>{p.name}</p>
                <p style={{ font: 'var(--font-label)', color: 'var(--on-surface-variant)', fontSize: 12 }}>
                  {t('categories.' + p.category)} — {p.price.toLocaleString()}₴
                  <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>{t('product.condition.' + p.condition.toLowerCase().replace(/\s+/g, '_'))}</span>
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{p.colors.map((c) => c.name).join(', ')}</p>
                {p.description && <p style={{ font: 'var(--font-body)', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.description}</p>}
                {p.collections && p.collections.length > 0 && (
                  <p style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>{p.collections.join(', ')}</p>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} style={{ color: 'var(--error)', cursor: 'pointer', padding: 4 }}>
                <Icon name="delete" />
              </button>
            </Glass>
          ))}
        </div>

        {/* Floating Add Button */}
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
