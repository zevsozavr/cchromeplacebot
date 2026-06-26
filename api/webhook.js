import { connectToDatabase } from '../lib/db.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8962788106:AAHRlKbCNCHe4nW47PmKJkQeMzDIc7GpDZ0';
const APP_URL = 'https://cchromeplacebot.vercel.app';

// Set native Telegram Mini App button (left of message input)
async function setMenuButton() {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: { type: 'web_app', text: 'CCHROME PLACE', web_app: { url: APP_URL } }
      }),
    });
  } catch {}
}

setMenuButton();

function t(lang) {
  if (lang === 'lang_ua' || lang === 'ua') return { welcome: 'Ласкаво просимо!', btn: 'Відкрити' }
  if (lang === 'lang_ru' || lang === 'ru') return { welcome: 'Добро пожаловать!', btn: 'Открыть' }
  return { welcome: 'Welcome', btn: 'Open' }
}

async function tgSend(params) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

async function tgAnswerCb(id) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id }),
  });
}

// Save language to DB
async function saveUserLang(chatId, lang) {
  try {
    const db = await connectToDatabase();
    if (!db) return;
    await db.collection('user_langs').updateOne(
      { chatId: String(chatId) },
      { $set: { lang, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('Failed to save user lang to DB:', err);
  }
}

// Load language from DB
async function loadUserLang(chatId) {
  try {
    const db = await connectToDatabase();
    if (!db) return null;
    const doc = await db.collection('user_langs').findOne({ chatId: String(chatId) });
    return doc ? doc.lang : null;
  } catch (err) {
    console.error('Failed to load user lang from DB:', err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Webhook active' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, callback_query } = req.body;

  if (callback_query) {
    const { data, from, id } = callback_query;
    const chatId = from.id;
    await tgAnswerCb(id);

    if (data === 'lang_ua' || data === 'lang_ru') {
      await saveUserLang(chatId, data);
    }

    const userLang = await loadUserLang(chatId) || userLangs[chatId] || 'lang_ua';
    const texts = t(userLang);
    await tgSend({
      chat_id: chatId,
      text: texts.welcome,
      reply_markup: {
        inline_keyboard: [[
          { text: texts.btn, web_app: { url: APP_URL } }
        ]]
      }
    });

    return res.json({ ok: true });
  }

  if (!message) return res.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start')) {
    const userLang = await loadUserLang(chatId);
    if (!userLang) {
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
      const texts = t(userLang);
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
}

// Fallback in-memory store (for cold starts before DB loads)
let userLangs = {};
