import fetch from 'node-fetch';

const BOT_TOKEN = process.env.BOT_TOKEN || '8849846358:AAH1QyRQpjS2DEh868mlrbzRrbK-QgkwYtc';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-app.vercel.app/api/webhook';

const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: WEBHOOK_URL }),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
