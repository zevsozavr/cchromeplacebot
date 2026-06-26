import { initDb, saveUserLang, getUserLang, upsertChannelProduct } from '../lib/db.js';

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

// ---- Post parser -----------------------------------------------------------

const CATEGORY_KEYWORDS = [
  { cat: 'Outerwear', words: ['куртк', 'пуховик', 'пальто', 'плащ', 'бомбер', 'худ', 'hoodie', 'жилет', 'парк', 'вітровк', 'ветровк', 'jacket', 'coat', 'puffer'] },
  { cat: 'Tops', words: ['футболк', 'лонгслів', 'лонгслив', 'сорочк', 'рубашк', 'светр', 'свитер', 'кофт', 'реглан', 'поло', 'tee', 'shirt', 'tshirt', 'sweater', 'longsleeve'] },
  { cat: 'Bottoms', words: ['штан', 'брюк', 'джинс', 'шорт', 'спідниц', 'юбк', 'карго', 'jeans', 'pants', 'shorts', 'trousers', 'cargo'] },
  { cat: 'Shoes', words: ['кросівк', 'кроссовк', 'взутт', 'кед', 'черевик', 'ботин', 'сандал', 'sneaker', 'shoes', 'boots', 'jordan', 'air max', 'dunk', 'yeezy'] },
  { cat: 'Accessories', words: ['сумк', 'кепк', 'шапк', 'окуляр', 'очки', 'ремін', 'ремень', 'рюкзак', 'панам', 'бананк', 'аксесуар', 'bag', 'cap', 'hat', 'beanie', 'belt', 'backpack'] },
];

const KNOWN_COLORS = [
  { re: /(чорн|черн|black)/i, name: 'Black', hex: '#000000' },
  { re: /(біл|бел|white)/i, name: 'White', hex: '#ffffff' },
  { re: /(сір|сер|gray|grey)/i, name: 'Gray', hex: '#9ca3af' },
  { re: /(червон|красн|red)/i, name: 'Red', hex: '#ef4444' },
  { re: /(син|блакит|голуб|blue)/i, name: 'Blue', hex: '#3b82f6' },
  { re: /(зелен|green|хакі|хаки|khaki)/i, name: 'Green', hex: '#22c55e' },
  { re: /(жовт|желт|yellow)/i, name: 'Yellow', hex: '#eab308' },
  { re: /(беж|beige|крем|cream)/i, name: 'Beige', hex: '#f5e6d3' },
  { re: /(коричнев|brown)/i, name: 'Brown', hex: '#92400e' },
  { re: /(рожев|розов|pink)/i, name: 'Pink', hex: '#ec4899' },
];

function parseProduct(caption) {
  const text = (caption || '').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Name = first line, stripped of leading emoji/symbols and trailing price
  let name = lines[0] || 'New Item';
  name = name.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*[-–—:]\s*\d[\d\s.,]*\s*(?:₴|грн|uah|\$)?\s*$/i, '').trim() || 'New Item';

  // Price — char class excludes newline so a stray digit in the name (e.g.
  // "Jordan 1") can't bleed across lines into the real price.
  let price = 0;
  const priceMatch =
    text.match(/(?:ціна|цена|price|вартість)\s*[:\-]?\s*(\d[\d .,]*)/i) ||
    text.match(/(\d[\d .,]*)\s*(?:₴|грн|гривен|uah)/i) ||
    text.match(/[₴$]\s*(\d[\d .,]*)/);
  if (priceMatch) {
    let raw = priceMatch[1].replace(/[^\d.,]/g, '');       // drop spaces
    raw = raw.replace(/[.,](?=\d{3}(?:\D|$))/g, '');         // drop thousands separators
    raw = raw.replace(',', '.');                            // comma decimal → dot
    price = Math.round(parseFloat(raw)) || 0;
  }

  // Sizes — explicit "розмір/size" line, else collect standalone size tokens
  let sizes = [];
  const sizeLine = text.match(/(?:розмір[и]?|размер[ы]?|size[s]?|р[-\s.]*р|р\.)\s*[:\-]?\s*([^\n]+)/i);
  if (sizeLine) {
    sizes = sizeLine[1]
      .split(/[,;\/|]+|\s{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 6 && /[a-zа-я0-9]/i.test(s));
  }
  if (sizes.length === 0) {
    const tokens = text.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|3XL|2XL)\b/gi) || [];
    sizes = [...new Set(tokens.map((t) => t.toUpperCase()))];
  }
  if (sizes.length === 0) {
    const eu = text.match(/(?:розмір|размер|size|eu)\D{0,4}(3[5-9]|4[0-6])\b/i);
    if (eu) sizes = [eu[1]];
  }
  if (sizes.length === 0) sizes = ['One Size'];

  // Colors
  const colors = [];
  for (const c of KNOWN_COLORS) {
    if (c.re.test(text) && !colors.some((x) => x.name === c.name)) colors.push({ name: c.name, hex: c.hex });
  }
  if (colors.length === 0) colors.push({ name: 'Default', hex: '#000000' });

  // Condition
  let condition = 'New';
  if (/(б\/?[ув]|вживан|бывш|used|second)/i.test(text)) condition = 'Good';
  else if (/(як нов|идеальн|ideal|mint|deadstock|\bds\b)/i.test(text)) condition = 'Like New';
  else if (/(нов|new|brand new)/i.test(text)) condition = 'New';

  // Category guess
  let category = 'All';
  const lower = text.toLowerCase();
  for (const { cat, words } of CATEGORY_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) { category = cat; break; }
  }

  return { name, price, sizes, colors, condition, category, description: text };
}

async function getPhotoUrl(message) {
  if (!message.photo || message.photo.length === 0) return '';
  const fileId = message.photo[message.photo.length - 1].file_id;
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    if (!r.ok) return '';
    const d = await r.json();
    if (d.ok && d.result?.file_path) return `https://api.telegram.org/file/bot${BOT_TOKEN}/${d.result.file_path}`;
  } catch {}
  return '';
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

  // Channel forward OR a photo sent directly to the bot → parse as product.
  if (message && (message.forward_from_chat || message.photo)) {
    await initDb();
    const caption = (message.caption || message.text || '').trim();
    const photoUrl = await getPhotoUrl(message);

    // A post must have either a caption or a photo to be a product.
    if (!caption && !photoUrl) return res.json({ ok: true });

    const parsed = parseProduct(caption);

    // Album support: Telegram delivers multi-photo posts as separate messages
    // sharing media_group_id (only the first carries the caption). Use a stable
    // id per album so the extra photos merge into one product instead of making
    // duplicate products.
    const id = message.media_group_id
      ? `ch_${message.chat.id}_${message.media_group_id}`
      : `ch_${message.chat.id}_${message.message_id}`;

    const product = {
      id,
      name: parsed.name,
      price: parsed.price,
      category: parsed.category,
      subcategory: undefined,
      sizes: parsed.sizes,
      colors: parsed.colors,
      condition: parsed.condition,
      description: parsed.description,
      image: photoUrl,
      images: photoUrl ? [photoUrl] : undefined,
      sizeStock: Object.fromEntries(parsed.sizes.map((s) => [s, 999])),
    };

    const { ok, product: stored } = await upsertChannelProduct(product);

    // Only confirm on the caption-bearing (first) message to avoid spamming for
    // each album photo.
    if (caption) {
      await tgSend({
        chat_id: message.chat.id,
        text: ok
          ? `✅ Товар «${stored.name}» додано\n💵 Ціна: ${stored.price || '—'}₴\n🏷 Категорія: ${stored.category}\n📏 Розміри: ${(stored.sizes || []).join(', ')}\n🎨 Колір: ${(stored.colors || []).map((c) => c.name).join(', ')}\n🧩 Стан: ${stored.condition}`
          : `❌ Помилка: товар «${parsed.name}» не збережено — база даних недоступна`,
      });
    }
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
