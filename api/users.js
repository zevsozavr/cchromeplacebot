import { initDb, getUsers, getOrders, getAppData, saveAppData, deleteUser } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();

  try {
    if (req.method === 'GET') {
      const [users, orders, appData] = await Promise.all([getUsers(), getOrders(), getAppData()]);
      const deals = appData?.deals || [];

      // Map registered users
      const userMap = {};
      for (const u of users) {
        userMap[String(u.id)] = {
          id: u.id,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          username: u.username || '',
          language_code: u.language_code || '',
          phone: u.phone || '',
          orders: [],
          totalSpent: 0,
          deal: null,
        };
      }

      // Group orders
      const guestMap = {};
      for (const o of orders) {
        const orderUserId = o.userId ? String(o.userId) : null;
        if (orderUserId && userMap[orderUserId]) {
          userMap[orderUserId].orders.push(o);
          userMap[orderUserId].totalSpent += Number(o.total) || 0;
          if (o.phone) userMap[orderUserId].phone = o.phone;
        } else {
          const key = o.phone || o.name || 'Unknown';
          if (!guestMap[key]) {
            guestMap[key] = {
              id: null,
              first_name: o.name || '',
              last_name: '',
              username: '',
              phone: o.phone || '',
              orders: [],
              totalSpent: 0,
              deal: null,
            };
          }
          guestMap[key].orders.push(o);
          guestMap[key].totalSpent += Number(o.total) || 0;
        }
      }

      const combined = [...Object.values(userMap), ...Object.values(guestMap)];

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
      const appData = await getAppData();
      const deals = (appData?.deals || []).filter((d) => d.phone !== phone);
      deals.push({ phone, discountPercent: Number(discountPercent) || 0, note: note || '', createdAt: new Date().toISOString() });
      await saveAppData({ ...appData, deals });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { phone, tgId } = req.query;
      if (phone) {
        const appData = await getAppData();
        const deals = (appData?.deals || []).filter((d) => d.phone !== phone);
        await saveAppData({ ...appData, deals });
      }
      if (tgId) {
        await deleteUser(String(tgId));
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
