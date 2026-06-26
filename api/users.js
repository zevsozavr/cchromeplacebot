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
      const orders = data.orders || [];
      const deals = data.deals || [];

      // Map of registered users by their TG ID
      const userMap = {};
      for (const u of registeredUsers) {
        userMap[String(u.id)] = {
          id: u.id,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          username: u.username || '',
          language_code: u.language_code || '',
          lastSeen: u.lastSeen || '',
          phone: '',
          orders: [],
          totalSpent: 0,
          deal: null
        };
      }

      // Group orders and match with registered users
      const guestMap = {};
      for (const o of orders) {
        const orderUserId = o.userId ? String(o.userId) : null;
        if (orderUserId && userMap[orderUserId]) {
          // Registered user order
          userMap[orderUserId].orders.push(o);
          userMap[orderUserId].totalSpent += Number(o.total) || 0;
          if (o.phone) {
            userMap[orderUserId].phone = o.phone;
          }
        } else {
          // Guest order, group by phone (or name if phone missing)
          const key = o.phone || o.name || 'Unknown';
          if (!guestMap[key]) {
            guestMap[key] = {
              id: null,
              first_name: o.name || '',
              last_name: '',
              username: '',
              lastSeen: o.date || '',
              phone: o.phone || '',
              orders: [],
              totalSpent: 0,
              deal: null
            };
          }
          guestMap[key].orders.push(o);
          guestMap[key].totalSpent += Number(o.total) || 0;
        }
      }

      const combined = [...Object.values(userMap), ...Object.values(guestMap)];

      // Attach deals/discounts
      const result = combined.map((u) => {
        const deal = deals.find(
          (d) =>
            (u.phone && d.phone === u.phone) ||
            (u.username && d.phone === u.username) ||
            (u.id && String(d.phone) === String(u.id))
        ) || null;
        return { ...u, deal };
      });

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
