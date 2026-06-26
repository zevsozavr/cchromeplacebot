import { initDb, getAppData, saveAppData } from '../lib/db.js';

// Merge the client's snapshot with the server's current state so a save from the
// admin app can't wipe products another writer (e.g. a forwarded channel post)
// added after the admin app loaded. `knownIds` = every product id the client is
// aware of; any server product whose id the client does NOT know is preserved.
function mergeProducts(incoming, knownIds, current) {
  if (!Array.isArray(knownIds)) return incoming;
  const known = new Set(knownIds);
  const foreign = (current.products || []).filter((p) => !known.has(p.id));
  return [...incoming, ...foreign];
}

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
      const current = await getAppData();
      const products = mergeProducts(body.products, body.knownIds, current || { products: [] });
      const data = { products, npConfig: body.npConfig };
      const saved = await saveAppData(data);
      if (!saved) return res.status(503).json({ error: 'Database not configured' });
      return res.json({ ok: true, data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
