import { getWarehouses } from '../lib/np.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const cityRef = req.query.cityRef || '';
    const query = (req.query.q || '').trim();
    if (!cityRef) return res.status(400).json({ error: 'cityRef required' });

    const warehouses = await getWarehouses(cityRef, query);
    return res.json(warehouses.map((w) => ({ ref: w.Ref, name: w.Description, number: w.Number })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
