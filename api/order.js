import crypto from 'crypto';
import { initDb, saveOrder, getOrders, saveUser } from '../lib/db.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8962788106:AAHRlKbCNCHe4nW47PmKJkQeMzDIc7GpDZ0';
const ADMIN_IDS = [7264276513, 822479618];

function validateTelegramData(initData) {
  if (!initData) return false;
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    urlParams.sort();
    const dataCheckString = Array.from(urlParams.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return computedHash === hash;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();

  if (req.method === 'GET') {
    const orders = await getOrders();
    return res.json(orders);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { initData, order } = req.body;
  let user = {};

  if (initData) {
    try {
      const urlParams = new URLSearchParams(initData);
      user = JSON.parse(urlParams.get('user') || '{}');
    } catch {}
  }

  try {
    const orderWithUser = {
      ...order,
      userId: user.id || null,
      date: order.date || new Date().toISOString(),
    };
    await saveOrder(orderWithUser);
    if (user.id) {
      await saveUser(user);
    }
  } catch (dbErr) {
    console.error('Failed to save order to DB:', dbErr);
  }

  const itemsList = order.items
    .map((i) => `• ${i.name} (${i.color || i.selectedColor || ''}/${i.size || i.selectedSize || ''}) × ${i.quantity} — ${i.price * i.quantity}₴`)
    .join('\n');

  const prepayText = order.prepay ? `💳 *ПЕРЕДОПЛАТА*` : `💵 *ПІСЛЯПЛАТА*`;
  const ttnText = order.ttn ? `📦 *ТТН:* ${order.ttn}` : '';

  const message = [
    `🛍 *Нове замовлення — cchrome place*`,
    ``,
    `*Номер:* #${order.id}`,
    `*Ім'я:* ${order.name}`,
    `*Телефон:* ${order.phone}`,
    `*Адреса:* ${order.address}`,
    `*Оплата:* ${prepayText}`,
    ttnText,
    `*TG:* ${user.first_name || ''} ${user.last_name || ''} @${user.username || ''}`,
    ``,
    `*Товари:*`,
    itemsList,
    ``,
    `*Сума:* ${order.total}₴`,
  ].filter(Boolean).join('\n');

  await Promise.allSettled(ADMIN_IDS.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: message, parse_mode: 'Markdown' }),
    })
  ));

  res.json({ ok: true });
}
