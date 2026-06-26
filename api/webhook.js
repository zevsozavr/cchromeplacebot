const BOT_TOKEN = process.env.BOT_TOKEN || '8962788106:AAHRlKbCNCHe4nW47PmKJkQeMzDIc7GpDZ0';

// Simple in-memory user lang store (note: resets on Vercel cold start)
let userLangs = {};

function t(lang) {
  if (lang === 'lang_ua') return { welcome: 'Ласкаво просимо!', btn: 'Відкрити' }
  if (lang === 'lang_ru') return { welcome: 'Добро пожаловать!', btn: 'Открыть' }
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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Webhook active' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, callback_query } = req.body;
  const webAppUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://cchromeplacebot.vercel.app';

  if (callback_query) {
    const { data, from, id } = callback_query;
    const chatId = from.id;
    await tgAnswerCb(id);

    if (data === 'lang_ua' || data === 'lang_ru') {
      userLangs[chatId] = data;
    }

    const texts = t(userLangs[chatId]);
    await tgSend({
      chat_id: chatId,
      text: texts.welcome,
      reply_markup: {
        inline_keyboard: [[
          { text: texts.btn, web_app: { url: webAppUrl } }
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
            { text: texts.btn, web_app: { url: webAppUrl } }
          ]]
        }
      });
    }
  }

  res.json({ ok: true });
}
