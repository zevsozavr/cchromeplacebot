const EC = process.env.EDGE_CONFIG || '';
const EC_MATCH = EC.match(/edge-config\.vercel\.com\/([^?]+)\?token=(.+)/);
const EC_ID = EC_MATCH?.[1] || '';
const EC_TOKEN = EC_MATCH?.[2] || '';
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || '';
const EC_BASE = `https://edge-config.vercel.com/${EC_ID}`;
const MGMT_API = 'https://api.vercel.com/v1/edge-config';

async function edgeRead() {
  if (!EC_ID || !EC_TOKEN) return null;
  try {
    const res = await fetch(`${EC_BASE}/items?token=${EC_TOKEN}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Write via Vercel Management API (requires VERCEL_API_TOKEN env var)
async function edgeWrite(key, value) {
  if (!EC_ID || !VERCEL_TOKEN) return false;
  try {
    const res = await fetch(`${MGMT_API}/${EC_ID}/items`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key, value }],
      }),
    });
    return res.ok;
  } catch { return false; }
}

let cachedAll = null;
let localFallback = null; // In-memory fallback when no VERCEL_API_TOKEN

async function getAll() {
  if (cachedAll) return cachedAll;
  if (localFallback) return localFallback;
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
  if (all?.app_data) return all.app_data;
  // Seed if app_data key doesn't exist
  const seed = { products: [] };
  if (VERCEL_TOKEN) await edgeWrite('app_data', seed);
  if (cachedAll) cachedAll.app_data = seed;
  return seed;
}

export async function saveAppData(data) {
  cachedAll = null;
  localFallback = null;
  const ok = await edgeWrite('app_data', data);
  if (!ok) {
    // In-memory fallback for the current invocation
    const all = await getAll() || {};
    all.app_data = data;
    cachedAll = all;
    localFallback = all;
  }
  return true;
}

export async function saveOrder(order) {
  cachedAll = null;
  localFallback = null;
  const all = (await getAll()) || {};
  const orders = all.orders || [];
  orders.push(order);
  const ok = await edgeWrite('orders', orders);
  if (!ok) {
    all.orders = orders;
    cachedAll = all;
    localFallback = all;
  }
  return true;
}

export async function getOrders() {
  const all = await getAll();
  if (all?.orders) return all.orders;
  const seed = [];
  if (VERCEL_TOKEN) await edgeWrite('orders', seed);
  if (cachedAll) cachedAll.orders = seed;
  return seed;
}

export async function deleteOrder(id) {
  cachedAll = null;
  localFallback = null;
  const all = (await getAll()) || {};
  const orders = (all.orders || []).filter((o) => o.id !== id);
  const ok = await edgeWrite('orders', orders);
  if (!ok) {
    all.orders = orders;
    cachedAll = all;
    localFallback = all;
  }
  return true;
}

export async function saveUser(user) {
  cachedAll = null;
  localFallback = null;
  const all = (await getAll()) || {};
  const users = all.users || [];
  const idx = users.findIndex((u) => String(u.id) === String(user.id));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push({ ...user, lastSeen: new Date().toISOString() });
  }
  const ok = await edgeWrite('users', users);
  if (!ok) {
    all.users = users;
    cachedAll = all;
    localFallback = all;
  }
  return true;
}

export async function getUsers() {
  const all = await getAll();
  return all?.users || [];
}

export async function deleteUser(id) {
  cachedAll = null;
  localFallback = null;
  const all = (await getAll()) || {};
  const users = (all.users || []).filter((u) => String(u.id) !== String(id));
  const ok = await edgeWrite('users', users);
  if (!ok) {
    all.users = users;
    cachedAll = all;
    localFallback = all;
  }
  return true;
}

export async function saveUserLang(chatId, lang) {
  cachedAll = null;
  localFallback = null;
  const all = (await getAll()) || {};
  const langs = all.user_langs || {};
  langs[String(chatId)] = lang;
  const ok = await edgeWrite('user_langs', langs);
  if (!ok) {
    all.user_langs = langs;
    cachedAll = all;
    localFallback = all;
  }
  return true;
}

export async function getUserLang(chatId) {
  const all = await getAll();
  const langs = all?.user_langs || {};
  return langs[String(chatId)] || null;
}
