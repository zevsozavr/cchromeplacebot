const SUPA_URL = process.env.SUPA_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPA_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function supaHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`,
    'Prefer': 'return=minimal',
  };
}

async function ensureTable() {
  // Try upserting a test row — if table doesn't exist, create it via raw SQL endpoint
  const r = await fetch(`${SUPA_URL}/rest/v1/kv_store?key=eq._init`, {
    headers: { ...supaHeaders(), 'Accept': 'application/json' },
  });
  if (r.status === 404 || r.status === 400) {
    // Table doesn't exist, try creating via pg_dump or use Supabase's SQL endpoint
    // Use the Supabase management API to execute SQL
    const sql = `CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);`;
    const sqlR = await fetch(`${SUPA_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: supaHeaders(),
      body: JSON.stringify({ sql }),
    });
    if (!sqlR.ok) {
      // Fallback: try inserting directly (might work if table auto-created)
      const fallback = await fetch(`${SUPA_URL}/rest/v1/kv_store`, {
        method: 'POST',
        headers: supaHeaders(),
        body: JSON.stringify({ key: '_init', value: { ok: true } }),
      });
      if (!fallback.ok) throw new Error(`Cannot create table: ${fallback.status}`);
    }
  }
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

async function del(key) {
  const r = await fetch(`${SUPA_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: supaHeaders(),
  });
  return r.ok;
}

async function getAll() {
  const r = await fetch(`${SUPA_URL}/rest/v1/kv_store?select=key,value`, {
    headers: { ...supaHeaders(), 'Accept': 'application/json' },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  const obj = {};
  for (const row of rows) obj[row.key] = row.value;
  return obj;
}

export async function initDb() {
  try {
    await ensureTable();
    return true;
  } catch { return false; }
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

export async function getOrders() {
  const val = await get('orders');
  if (val) return val;
  await set('orders', []);
  return [];
}

export async function saveOrder(order) {
  const orders = await getOrders();
  orders.push(order);
  return await set('orders', orders);
}

export async function deleteOrder(id) {
  const orders = await getOrders();
  const filtered = orders.filter((o) => o.id !== id);
  return await set('orders', filtered);
}

export async function getUsers() {
  const val = await get('users');
  return val || [];
}

export async function saveUser(user) {
  const users = await getUsers();
  const idx = users.findIndex((u) => String(u.id) === String(user.id));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push({ ...user, lastSeen: new Date().toISOString() });
  }
  return await set('users', users);
}

export async function deleteUser(id) {
  const users = await getUsers();
  const filtered = users.filter((u) => String(u.id) !== String(id));
  return await set('users', filtered);
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

export async function saveAppData(data) {
  return await set('app_data', data);
}