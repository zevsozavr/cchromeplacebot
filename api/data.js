import { initDb, getAppData, saveAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();

  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const data = await getAppData();
      if (!data) return res.status(503).json({ error: 'Database not configured' });
      return res.json(data);
    }

    // PUT = normal save; POST = navigator.sendBeacon flush on app close (same payload)
    if (req.method === 'PUT' || req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      if (!body || typeof body !== 'object' || !Array.isArray(body.products)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      const saved = await saveAppData(body);
      if (!saved) return res.status(503).json({ error: 'Database not configured' });
      return res.json({ ok: true, data: body });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
