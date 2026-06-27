import { createShipment } from '../lib/np.js';
import { getAppData, saveAppData } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, cityRef, warehouseRef, recipientName, recipientPhone, declaredCost, weight, prepay } = req.body;

    // Load sender config from DB
    const data = await getAppData();
    const config = data?.npConfig;

    if (config?.senderRef && config?.senderAddressRef && config?.contactSenderRef) {
      // Real NP shipment creation
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
        description: `Замовлення cchrome place`,
        payerType: prepay ? 'Sender' : 'Recipient',
        paymentMethod: prepay ? 'NonCash' : 'Cash',
      });
      const ttn = result.IntDocNumber;
      return res.json({
        ttn,
        cost: result.CostOnSite ? Number(result.CostOnSite) : null,
      });
    }

    // Fallback: generate placeholder TTN
    const placeholderTtn = `NP-${Date.now().toString(36).toUpperCase()}`;
    return res.json({
      ttn: placeholderTtn,
      cost: null,
      placeholder: true,
      message: 'Shipment not created automatically. Configure NP sender in admin panel.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
