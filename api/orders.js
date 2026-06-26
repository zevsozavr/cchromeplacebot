import { getAppData, saveAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const data = await getAppData();
    if (!data) return res.status(503).json({ error: 'Database not configured' });

    if (req.method === 'GET') {
      return res.json(data.orders || []);
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { status } = req.body;
      const orders = (data.orders || []).map((o) => o.id === id ? { ...o, status } : o);
      await saveAppData({ ...data, orders });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const orders = (data.orders || []).filter((o) => o.id !== id);
      await saveAppData({ ...data, orders });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
