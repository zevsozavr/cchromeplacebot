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
      const registeredUsers = data.users || [];

      // Also derive from orders
      const orderMap = {};
      for (const order of (data.orders || [])) {
        const key = order.phone || order.name;
        if (!orderMap[key]) orderMap[key] = { name: order.name, phone: order.phone, orders: [], totalSpent: 0 };
        orderMap[key].orders.push(order);
        orderMap[key].totalSpent += order.total;
      }
      const orderUsers = Object.values(orderMap);

      // Merge: registered users + order users, keyed by phone
      const merged = {};
      for (const u of registeredUsers) {
        const key = u.username || `tg_${u.id}`;
        merged[key] = { ...u, orders: [], totalSpent: 0, deal: null };
      }
      for (const u of orderUsers) {
        const key = u.phone || u.name;
        if (merged[key]) {
          merged[key].orders = u.orders;
          merged[key].totalSpent = u.totalSpent;
          merged[key].phone = u.phone;
        } else {
          merged[key] = { ...u, id: null, first_name: '', last_name: '', username: '', lastSeen: '', deal: null };
        }
      }

      const deals = data.deals || [];
      const result = Object.values(merged).map((u) => ({
        ...u,
        deal: deals.find((d) => d.phone === u.phone || d.phone === u.username) || null,
      }));

      return res.json(result);
    }

    if (req.method === 'POST') {
      const { phone, discountPercent, note } = req.body;
      const deals = (data.deals || []).filter((d) => d.phone !== phone);
      deals.push({ phone, discountPercent: Number(discountPercent) || 0, note: note || '', createdAt: new Date().toISOString() });
      await saveAppData({ ...data, deals });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { phone, tgId } = req.query;
      if (phone) {
        const deals = (data.deals || []).filter((d) => d.phone !== phone);
        await saveAppData({ ...data, deals });
      }
      if (tgId) {
        const users = (data.users || []).filter((u) => u.id !== Number(tgId));
        await saveAppData({ ...data, users });
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
