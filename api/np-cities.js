import { searchCities } from '../lib/np.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const query = (req.query.q || '').trim();
    const cities = await searchCities(query);
    return res.json(cities.map((c) => ({ ref: c.Ref, name: c.Description, fullName: c.Present })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
