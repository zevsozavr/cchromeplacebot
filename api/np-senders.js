import { npRequest } from '../lib/np.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const counterparties = await npRequest('Counterparty', 'getCounterparties', {
      CounterpartyProperty: 'Sender',
      Page: '1',
    });

    const senders = counterparties.map((c) => ({
      ref: c.Ref,
      name: c.Description,
      cityRef: c.City,
      cityName: c.CityDescription,
    }));

    // If a senderRef is given, also fetch its contact persons
    const { senderRef } = req.query;
    if (senderRef) {
      const contacts = await npRequest('Counterparty', 'getCounterpartyContactPersons', {
        Ref: senderRef,
        Page: '1',
      });
      return res.json({
        senders,
        contacts: contacts.map((c) => ({
          ref: c.Ref,
          name: `${c.FirstName} ${c.LastName}`,
          phone: c.Phones,
        })),
      });
    }

    return res.json({ senders, contacts: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
