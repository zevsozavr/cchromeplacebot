import { initDb, saveUser } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await initDb();

  try {
    const { id, first_name, last_name, username, language_code } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    await saveUser({
      id: String(id),
      first_name,
      last_name,
      username,
      language_code,
    });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
