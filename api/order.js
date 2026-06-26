import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '8649366560:AAE_Resk8hYpJUFKaLguojKkgRyH54OQbyo';
const NOTIFY_CHAT_ID = process.env.NOTIFY_CHAT_ID || '822479618';

function validateTelegramData(initData) {
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { initData, order } = req.body;
  if (!validateTelegramData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user') || '{}');

  const itemsList = order.items
    .map((i) => `• ${i.name} (${i.color}/${i.size}) × ${i.quantity} — ${i.price * i.quantity}₴`)
    .join('\n');

  const message = [
    `🛍 *New Order — Trippie*`,
    ``,
    `*Name:* ${order.name}`,
    `*Phone:* ${order.phone}`,
    `*Address:* ${order.address}`,
    `*TG:* ${user.first_name || ''} ${user.last_name || ''} @${user.username || ''}`,
    ``,
    `*Items:*`,
    itemsList,
    ``,
    `*Total:* ${order.total}₴`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: NOTIFY_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  res.json({ ok: true });
}