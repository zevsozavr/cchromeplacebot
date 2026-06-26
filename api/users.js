import { getAppData, saveAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const data = await getAppData();
    if (!data) return res.status(503).json({ error: 'Database not configured' });

    if (req.method === 'GET') {
      // Derive users from orders
      const orderMap = {};
      for (const order of (data.orders || [])) {
        const key = order.phone || order.name;
        if (!orderMap[key]) orderMap[key] = { name: order.name, phone: order.phone, orders: [], totalSpent: 0 };
        orderMap[key].orders.push(order);
        orderMap[key].totalSpent += order.total;
      }
      const users = Object.values(orderMap);

      // Attach deals
      const deals = data.deals || [];
      const usersWithDeals = users.map((u) => ({
        ...u,
        deal: deals.find((d) => d.phone === u.phone) || null,
      }));

      return res.json(usersWithDeals);
    }

    if (req.method === 'POST') {
      // Create/update a private deal for a user
      const { phone, discountPercent, note } = req.body;
      const deals = (data.deals || []).filter((d) => d.phone !== phone);
      deals.push({ phone, discountPercent: Number(discountPercent) || 0, note: note || '', createdAt: new Date().toISOString() });
      await saveAppData({ ...data, deals });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { phone } = req.query;
      const deals = (data.deals || []).filter((d) => d.phone !== phone);
      await saveAppData({ ...data, deals });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
