import { getAppData, saveAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = await getAppData();
    if (!data) return res.status(503).json({ error: 'Database not configured' });

    const { id, first_name, last_name, username, language_code } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    const existingUsers = data.users || [];
    const idx = existingUsers.findIndex((u) => u.id === id);
    const userEntry = {
      id,
      first_name: first_name || '',
      last_name: last_name || '',
      username: username || '',
      language_code: language_code || '',
      lastSeen: new Date().toISOString(),
    };

    if (idx >= 0) {
      existingUsers[idx] = { ...existingUsers[idx], ...userEntry };
    } else {
      existingUsers.push(userEntry);
    }

    await saveAppData({ ...data, users: existingUsers });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
