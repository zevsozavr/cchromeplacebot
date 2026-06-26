import express from 'express';
import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BOT_TOKEN = process.env.BOT_TOKEN || '8962788106:AAHRlKbCNCHe4nW47PmKJkQeMzDIc7GpDZ0';
const NOTIFY_CHAT_ID = process.env.NOTIFY_CHAT_ID || '822479618';
const APP_URL = process.env.PUBLIC_URL || 'https://cchromeplacebot.vercel.app';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

const distPath = join(__dirname, 'dist');

app.use(express.static(distPath));

const LANG_FILE = join(__dirname, 'user_langs.json');

let userLangs = {};
if (existsSync(LANG_FILE)) {
  try {
    userLangs = JSON.parse(readFileSync(LANG_FILE, 'utf-8'));
  } catch {}
}

function saveUserLangs() {
  writeFileSync(LANG_FILE, JSON.stringify(userLangs, null, 2));
}

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

async function tgSend(params) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

function t(lang) {
  if (lang === 'lang_ua') return { welcome: 'Ласкаво просимо!', btn: 'Відкрити' }
  if (lang === 'lang_ru') return { welcome: 'Добро пожаловать!', btn: 'Открыть' }
  return { welcome: 'Welcome', btn: 'Open' }
}

async function tgAnswerCb(id) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id }),
  });
}

app.post('/api/webhook', async (req, res) => {
  const { message, callback_query } = req.body;

  if (callback_query) {
    const { data, from, id } = callback_query;
    const chatId = from.id;
    await tgAnswerCb(id);

    if (data === 'lang_ua' || data === 'lang_ru') {
      userLangs[chatId] = data;
      saveUserLangs();
    }

    const texts = t(userLangs[chatId]);
    await tgSend({
      chat_id: chatId,
      text: texts.welcome,
      reply_markup: {
        inline_keyboard: [[
          { text: texts.btn, web_app: { url: publicUrl } }
        ]]
      }
    });

    return res.json({ ok: true });
  }

  if (!message) return res.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start')) {
    if (!userLangs[chatId]) {
      await tgSend({
        chat_id: chatId,
        text: 'Welcome! Choose your language:',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Українська', callback_data: 'lang_ua' }],
            [{ text: 'Русский', callback_data: 'lang_ru' }],
          ]
        }
      });
    } else {
      const texts = t(userLangs[chatId]);
      await tgSend({
        chat_id: chatId,
        text: texts.welcome,
        reply_markup: {
          inline_keyboard: [[
          { text: texts.btn, web_app: { url: APP_URL } }
          ]]
        }
      });
    }
  }

  res.json({ ok: true });
});

app.post('/api/order', async (req, res) => {
  const { initData, order } = req.body;

  if (!validateTelegramData(initData)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user') || '{}');

  const itemsList = order.items
    .map((i) => `• ${i.name} (${i.color}/${i.size}) × ${i.quantity} — $${i.price * i.quantity}`)
    .join('\n');

  const message = [
    `🛍 *New Order — Certified Clo*`,
    ``,
    `*Name:* ${order.name}`,
    `*Phone:* ${order.phone}`,
    `*Address:* ${order.address}`,
    `*TG:* ${user.first_name || ''} ${user.last_name || ''} @${user.username || ''}`,
    ``,
    `*Items:*`,
    itemsList,
    ``,
    `*Total:* $${order.total}`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: NOTIFY_CHAT_ID, text: message, parse_mode: 'Markdown' }),
  });

  res.json({ ok: true });
});

app.get('*', async (req, res) => {
  try {
    const html = await readFile(join(distPath, 'index.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
