const SUPA_URL = process.env.SUPA_URL || process.env.VITE_SUPABASE_URL;
const SUPA_KEY = process.env.SUPA_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const MGMT_KEY = process.env.SUPABASE_MGMT_KEY; // sbp_ key for Management API

function supaHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`,
    'Prefer': 'return=minimal',
  };
}

async function ensureTable() {
  if (!MGMT_KEY) return true; // assume table exists
  const check = await fetch(`${SUPA_URL}/rest/v1/kv_store?key=eq.__init&select=key&limit=1`, {
    headers: { ...supaHeaders(), 'Accept': 'application/json' },
  });
  if (check.ok || check.status !== 404) return true;
  const ref = SUPA_URL.replace('https://', '').replace('.supabase.co', '');
  await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MGMT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);' }),
  });
  return true;
}

async function get(key) {
  const r = await fetch(`${SUPA_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, {
    headers: { ...supaHeaders(), 'Accept': 'application/json' },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows.length > 0 ? rows[0].value : null;
}

async function set(key, value) {
  const r = await fetch(`${SUPA_URL}/rest/v1/kv_store`, {
    method: 'POST',
    headers: { ...supaHeaders(), 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ key, value }),
  });
  return r.ok || r.status === 201;
}

export async function initDb() {
  try { await ensureTable(); return true; }
  catch { return false; }
}

export async function getAppData() {
  const val = await get('app_data');
  if (val) return val;
  await set('app_data', { products: [] });
  return { products: [] };
}

export async function saveProduct(product) {
  const appData = await getAppData();
  appData.products = appData.products || [];
  if (!appData.products.find((p) => p.id === product.id)) {
    appData.products.push(product);
  }
  return await set('app_data', appData);
}

// Upsert a product parsed from a forwarded channel post. If a product with the
// same id already exists (e.g. another photo from the same media-group album),
// merge the new images in and fill any fields that were empty on the first pass.
export async function upsertChannelProduct(product) {
  const appData = await getAppData();
  appData.products = appData.products || [];
  const idx = appData.products.findIndex((p) => p.id === product.id);
  if (idx === -1) {
    appData.products.push(product);
  } else {
    const existing = appData.products[idx];
    const images = Array.from(new Set([...(existing.images || []), ...(product.images || [])])).filter(Boolean);
    appData.products[idx] = {
      ...existing,
      ...product,
      // keep the first/best caption-derived fields, only fill if missing
      name: (existing.name && existing.name !== 'New Item') ? existing.name : product.name,
      description: existing.description || product.description,
      price: existing.price || product.price,
      image: existing.image || product.image,
      images: images.length ? images : undefined,
    };
  }
  const ok = await set('app_data', appData);
  return { ok, product: appData.products[idx === -1 ? appData.products.length - 1 : idx] };
}

export async function saveAppData(data) {
  return await set('app_data', data);
}

export async function getOrders() {
  const val = await get('orders');
  return val || [];
}

export async function saveOrder(order) {
  const orders = await getOrders();
  orders.push(order);
  return await set('orders', orders);
}

export async function deleteOrder(id) {
  const orders = await getOrders();
  return await set('orders', orders.filter((o) => o.id !== id));
}

export async function getUsers() {
  return await get('users') || [];
}

export async function saveUser(user) {
  const users = await getUsers();
  const idx = users.findIndex((u) => String(u.id) === String(user.id));
  if (idx >= 0) users[idx] = { ...users[idx], ...user };
  else users.push({ ...user, lastSeen: new Date().toISOString() });
  return await set('users', users);
}

export async function deleteUser(id) {
  const users = await getUsers();
  return await set('users', users.filter((u) => String(u.id) !== String(id)));
}

export async function getUserLang(chatId) {
  const val = await get('user_langs');
  return val?.[String(chatId)] || null;
}

export async function saveUserLang(chatId, lang) {
  const val = await get('user_langs') || {};
  val[String(chatId)] = lang;
  return await set('user_langs', val);
}