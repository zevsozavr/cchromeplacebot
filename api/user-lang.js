import { initDb, saveUserLang, getUserLang } from '../lib/db.js';

export default async function handler(req, res) {
  await initDb();

  if (req.method === 'GET') {
    const { chatId } = req.query;
    if (!chatId) return res.json({ lang: null });
    try {
      const lang = await getUserLang(String(chatId));
      return res.json({ lang: lang || null });
    } catch {
      return res.json({ lang: null });
    }
  }

  if (req.method === 'POST') {
    const { chatId, lang } = req.body;
    if (!chatId || !lang) return res.status(400).json({ error: 'Missing chatId or lang' });
    try {
      await saveUserLang(String(chatId), lang);
    } catch {}
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
