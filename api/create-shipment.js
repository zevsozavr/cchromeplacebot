import { createShipment, npRequest } from '../lib/np.js';
import { getAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/create-shipment?senders=1 — list sender counterparties
  // GET /api/create-shipment?senderRef=X — list sender + contact persons
  if (req.method === 'GET') {
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

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { cityRef, warehouseRef, recipientName, recipientPhone, declaredCost, afterpayAmount, weight, prepay, description } = req.body;

    const data = await getAppData();
    const config = data?.npConfig;

    if (config?.senderRef && config?.senderAddressRef && config?.contactSenderRef) {
      const result = await createShipment({
        citySenderRef: config.citySenderRef,
        senderRef: config.senderRef,
        senderAddressRef: config.senderAddressRef,
        contactSenderRef: config.contactSenderRef,
        senderPhone: config.senderPhone,
        cityRecipientRef: cityRef,
        recipientAddressRef: warehouseRef,
        recipientName,
        recipientsPhone: recipientPhone,
        weightKg: weight || 0.5,
        declaredCost: declaredCost || 200,
        afterpayAmount: afterpayAmount || 0,
        description: description || 'Одяг',
        payerType: prepay ? 'Sender' : 'Recipient',
        paymentMethod: prepay ? 'NonCash' : 'Cash',
      });
      const ttn = result.IntDocNumber;
      return res.json({
        ttn,
        cost: result.CostOnSite ? Number(result.CostOnSite) : null,
      });
    }

    const placeholderTtn = `NP-${Date.now().toString(36).toUpperCase()}`;
    return res.json({
      ttn: placeholderTtn,
      cost: null,
      placeholder: true,
      message: 'Shipment not created automatically. Configure NP sender in admin panel.',
    });
  } catch (err) {
    console.error('[create-shipment] NP API error:', err.message);
    return res.status(500).json({ error: err.message, npError: true });
  }
}
