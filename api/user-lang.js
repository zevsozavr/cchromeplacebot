import { connectToDatabase } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { chatId } = req.query;
    if (!chatId) return res.json({ lang: null });

    try {
      const db = await connectToDatabase();
      if (db) {
        const doc = await db.collection('user_langs').findOne({ chatId: String(chatId) });
        if (doc) return res.json({ lang: doc.lang });
      }
    } catch {}

    return res.json({ lang: null });
  }

  if (req.method === 'POST') {
    const { chatId, lang } = req.body;
    if (!chatId || !lang) return res.status(400).json({ error: 'Missing chatId or lang' });

    try {
      const db = await connectToDatabase();
      if (db) {
        await db.collection('user_langs').updateOne(
          { chatId: String(chatId) },
          { $set: { lang, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    } catch {}

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
