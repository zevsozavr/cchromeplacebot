import { getDeliveryCost } from '../lib/np.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { citySenderRef, cityRecipientRef, weight, declaredCost } = req.body;
    if (!cityRecipientRef) return res.status(400).json({ error: 'cityRecipientRef required' });

    const cost = await getDeliveryCost(
      citySenderRef || '',
      cityRecipientRef,
      weight || 0.5,
      declaredCost || 1000
    );
    return res.json({ cost });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
