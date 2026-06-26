const EC = process.env.EDGE_CONFIG || '';
const EC_MATCH = EC.match(/edge-config\.vercel\.com\/([^?]+)\?token=(.+)/);
const EC_ID = EC_MATCH?.[1] || '';
const EC_TOKEN = EC_MATCH?.[2] || '';
const EC_BASE = `https://edge-config.vercel.com/${EC_ID}`;
const API = 'https://api.vercel.com/v1/edge-config';

async function edgeRead() {
  if (!EC_ID || !EC_TOKEN) return null;
  try {
    const res = await fetch(`${EC_BASE}/items?token=${EC_TOKEN}`);
    if (!res.ok) return null;
    const data = await res.json();
    const items = {};
    for (const item of data.items || []) {
      items[item.key] = item.value;
    }
    return items;
  } catch { return null; }
}

async function edgeWrite(key, value) {
  if (!EC_ID || !EC_TOKEN) return false;
  try {
    const res = await fetch(`${API}/${EC_ID}/items`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${EC_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key, value }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('edgeWrite failed:', res.status, text);
    }
    return res.ok;
  } catch (err) {
    console.error('edgeWrite error:', err);
    return false;
  }
}

let cachedAll = null;

async function getAll() {
  if (cachedAll) return cachedAll;
  cachedAll = await edgeRead();
  return cachedAll;
}

export async function initDb() {
  if (!EC_ID || !EC_TOKEN) return false;
  cachedAll = await edgeRead();
  return true;
}

export async function getAppData() {
  const all = await getAll();
  return all?.app_data || { products: [] };
}

export async function saveAppData(data) {
  cachedAll = null;
  return edgeWrite('app_data', data);
}

export async function saveOrder(order) {
  cachedAll = null;
  const all = (await getAll()) || {};
  const orders = all.orders || [];
  orders.push(order);
  return edgeWrite('orders', orders);
}

export async function getOrders() {
  const all = await getAll();
  return all?.orders || [];
}

export async function deleteOrder(id) {
  cachedAll = null;
  const all = (await getAll()) || {};
  const orders = (all.orders || []).filter((o) => o.id !== id);
  return edgeWrite('orders', orders);
}

export async function saveUser(user) {
  cachedAll = null;
  const all = (await getAll()) || {};
  const users = all.users || [];
  const idx = users.findIndex((u) => String(u.id) === String(user.id));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push({ ...user, lastSeen: new Date().toISOString() });
  }
  return edgeWrite('users', users);
}

export async function getUsers() {
  const all = await getAll();
  return all?.users || [];
}

export async function deleteUser(id) {
  cachedAll = null;
  const all = (await getAll()) || {};
  const users = (all.users || []).filter((u) => String(u.id) !== String(id));
  return edgeWrite('users', users);
}

export async function saveUserLang(chatId, lang) {
  cachedAll = null;
  const all = (await getAll()) || {};
  const langs = all.user_langs || {};
  langs[String(chatId)] = lang;
  return edgeWrite('user_langs', langs);
}

export async function getUserLang(chatId) {
  const all = await getAll();
  const langs = all?.user_langs || {};
  return langs[String(chatId)] || null;
}
