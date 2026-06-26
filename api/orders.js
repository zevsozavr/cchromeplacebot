import { getOrders, saveOrder, deleteOrder } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const orders = await getOrders();
      return res.json(orders);
    }

    if (req.method === 'PUT') {
      const orders = Array.isArray(req.body) ? req.body : [];
      // Replace all orders — clear cache then write each
      const { edgeWrite } = await import('../lib/db.js');
      await edgeWrite('orders', orders);
      return res.json({ ok: true });
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { status } = req.body;
      const orders = await getOrders();
      const updated = orders.map((o) => o.id === id ? { ...o, status } : o);
      const { edgeWrite } = await import('../lib/db.js');
      await edgeWrite('orders', updated);
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deleteOrder(id);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
