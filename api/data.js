import { getAppData, saveAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const data = await getAppData();
      if (!data) return res.status(503).json({ error: 'Database not configured' });
      return res.json(data);
    }

    if (req.method === 'PUT') {
      const saved = await saveAppData(req.body);
      if (!saved) return res.status(503).json({ error: 'Database not configured' });

      // Re-fetch and return the saved data so client stays in sync
      const fresh = await getAppData();
      return res.json({ ok: true, data: fresh });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
