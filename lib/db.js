import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!DATABASE_URL) return null;
  if (!sql) sql = neon(DATABASE_URL);
  return sql;
}

export async function initDb() {
  const s = getSql();
  if (!s) return false;
  try {
    await s`
      CREATE TABLE IF NOT EXISTS app_data (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO app_data (key, value) VALUES ('main', '{}'::jsonb) ON CONFLICT (key) DO NOTHING;

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items JSONB NOT NULL,
        total NUMERIC NOT NULL,
        shipping NUMERIC NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        ttn TEXT,
        prepay BOOLEAN DEFAULT FALSE,
        np_city TEXT,
        np_warehouse TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        username TEXT,
        phone TEXT,
        deal JSONB,
        language_code TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_langs (
        chat_id TEXT PRIMARY KEY,
        lang TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    return true;
  } catch (err) {
    console.error('initDb error:', err);
    return false;
  }
}

export async function getAppData() {
  const s = getSql();
  if (!s) return null;
  try {
    const rows = await s`SELECT value FROM app_data WHERE key = 'main'`;
    if (rows.length === 0) return { products: [] };
    return rows[0].value || { products: [] };
  } catch (err) {
    console.error('getAppData error:', err);
    return null;
  }
}

export async function saveAppData(data: Record<string, any>) {
  const s = getSql();
  if (!s) return false;
  try {
    await s`
      INSERT INTO app_data (key, value, updated_at)
      VALUES ('main', ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
    `;
    return true;
  } catch (err) {
    console.error('saveAppData error:', err);
    return false;
  }
}

export async function saveOrder(order: Record<string, any>) {
  const s = getSql();
  if (!s) return false;
  try {
    await s`
      INSERT INTO orders (id, items, total, shipping, date, name, phone, address, status, ttn, prepay, np_city, np_warehouse)
      VALUES (${order.id}, ${JSON.stringify(order.items)}::jsonb, ${order.total}, ${order.shipping || 0}, ${order.date}, ${order.name}, ${order.phone}, ${order.address}, ${order.status || 'new'}, ${order.ttn || null}, ${order.prepay || false}, ${order.npCity || null}, ${order.npWarehouse || null})
    `;
    return true;
  } catch (err) {
    console.error('saveOrder error:', err);
    return false;
  }
}

export async function getOrders() {
  const s = getSql();
  if (!s) return [];
  try {
    const rows = await s`SELECT * FROM orders ORDER BY created_at DESC`;
    return rows.map(r => ({
      id: r.id,
      items: r.items,
      total: Number(r.total),
      shipping: Number(r.shipping),
      date: r.date,
      name: r.name,
      phone: r.phone,
      address: r.address,
      status: r.status,
      ttn: r.ttn,
      prepay: r.prepay,
      npCity: r.np_city,
      npWarehouse: r.np_warehouse,
    }));
  } catch (err) {
    console.error('getOrders error:', err);
    return [];
  }
}

export async function deleteOrder(id: string) {
  const s = getSql();
  if (!s) return false;
  try {
    await s`DELETE FROM orders WHERE id = ${id}`;
    return true;
  } catch { return false; }
}

export async function saveUser(user: Record<string, any>) {
  const s = getSql();
  if (!s) return false;
  try {
    await s`
      INSERT INTO users (id, first_name, last_name, username, phone, deal, language_code)
      VALUES (${user.id}, ${user.first_name || null}, ${user.last_name || null}, ${user.username || null}, ${user.phone || null}, ${user.deal ? JSON.stringify(user.deal) : null}::jsonb, ${user.language_code || null})
      ON CONFLICT (id) DO UPDATE SET
        first_name = COALESCE(${user.first_name || null}, users.first_name),
        last_name = COALESCE(${user.last_name || null}, users.last_name),
        username = COALESCE(${user.username || null}, users.username),
        phone = COALESCE(${user.phone || null}, users.phone),
        deal = ${user.deal ? JSON.stringify(user.deal) : undefined}::jsonb,
        language_code = COALESCE(${user.language_code || null}, users.language_code)
    `;
    return true;
  } catch (err) {
    console.error('saveUser error:', err);
    return false;
  }
}

export async function getUsers() {
  const s = getSql();
  if (!s) return [];
  try {
    const rows = await s`SELECT * FROM users ORDER BY created_at DESC`;
    return rows.map(r => ({
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      username: r.username,
      phone: r.phone,
      deal: r.deal,
      language_code: r.language_code,
    }));
  } catch (err) {
    console.error('getUsers error:', err);
    return [];
  }
}

export async function deleteUser(id: string) {
  const s = getSql();
  if (!s) return false;
  try {
    await s`DELETE FROM users WHERE id = ${id}`;
    return true;
  } catch { return false; }
}

export async function saveUserLang(chatId: string, lang: string) {
  const s = getSql();
  if (!s) return false;
  try {
    await s`
      INSERT INTO user_langs (chat_id, lang, updated_at)
      VALUES (${chatId}, ${lang}, NOW())
      ON CONFLICT (chat_id) DO UPDATE SET lang = ${lang}, updated_at = NOW()
    `;
    return true;
  } catch (err) {
    console.error('saveUserLang error:', err);
    return false;
  }
}

export async function getUserLang(chatId: string) {
  const s = getSql();
  if (!s) return null;
  try {
    const rows = await s`SELECT lang FROM user_langs WHERE chat_id = ${chatId}`;
    return rows.length > 0 ? rows[0].lang : null;
  } catch (err) {
    console.error('getUserLang error:', err);
    return null;
  }
}
