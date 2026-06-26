import { initDb, saveUserLang, getUserLang, saveProduct } from '../lib/db.js';

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
  if (lang === 'lang_ru' || lang === 'ru') return { welcome: 'Добро пожаловать!', btn: 'Открыть' }
  return { welcome: 'Ласкаво просимо!', btn: 'Відкрити' }
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
async function saveUserLangToDB(chatId, lang) {
  try {
    await saveUserLang(String(chatId), lang);
  } catch (err) {
    console.error('Failed to save user lang to DB:', err);
  }
}

// Load language from DB
async function loadUserLangFromDB(chatId) {
  try {
    return await getUserLang(String(chatId));
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
    await initDb();

    if (data === 'lang_ua' || data === 'lang_ru') {
      await saveUserLangToDB(chatId, data);
    }

    const userLang = await loadUserLangFromDB(chatId) || userLangs[chatId] || 'lang_ua';
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

  // Channel forward: parse forwarded post as product
  if (message && message.forward_from_chat) {
    await initDb();
    const fc = message.forward_from_chat;
    // Only parse forwards from @cchromeplacee (or its id)
    const caption = (message.caption || message.text || '').trim();
    if (!caption) return res.json({ ok: true });

    const lines = caption.split('\n').filter(Boolean);
    const name = lines[0] || 'New Item';

    let price = 0;
    const priceMatch = caption.match(/(\d+[\s.,]?\d*)\s*(?:₴|грн|грив[еі]нь|uah)/i)
      || caption.match(/[₴$]\s*(\d+[\s.,]?\d*)/);
    if (priceMatch) price = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));

    let sizes = ['One Size'];
    const sizeMatch = caption.match(/розмір[и]?\s*:?\s*([^\n]+)/i);
    if (sizeMatch) {
      sizes = sizeMatch[1].split(/[,;\/\s]+/).filter((s) => s.trim().length > 0 && !/^\d+$/.test(s.trim())).map((s) => s.trim());
      if (sizes.length === 0) sizes = ['One Size'];
    }

    const images = [];
    if (message.photo && message.photo.length > 0) {
      const fileId = message.photo[message.photo.length - 1].file_id;
      try {
        const fileResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
        if (fileResp.ok) {
          const fileData = await fileResp.json();
          if (fileData.ok && fileData.result?.file_path) {
            images.push(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`);
          }
        }
      } catch {}
    }

    const product = {
      id: `ch_${message.message_id}_${Date.now()}`,
      name,
      price,
      category: 'All',
      sizes,
      colors: [{ name: 'Default', hex: '#000000' }],
      condition: 'New',
      description: caption,
      image: images[0] || '',
      images: images.length > 0 ? images : undefined,
      sizeStock: Object.fromEntries(sizes.map((s) => [s, 999])),
    };

    await saveProduct(product);

    await tgSend({
      chat_id: message.chat.id,
      text: `✅ Товар "${name}" створено (₴${price})`,
    });
    return res.json({ ok: true, parsed: true });
  }

  if (!message) return res.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start')) {
    await initDb();
    const userLang = await loadUserLangFromDB(chatId);
    if (!userLang) {
      await tgSend({
        chat_id: chatId,
        text: 'Оберіть мову:',
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
