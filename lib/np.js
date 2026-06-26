import { getAppData } from './db.js';

const API_URL = 'https://api.novaposhta.ua/v2.0/json/';

export async function npRequest(method, calledMethod, methodProperties = {}) {
  let apiKey = process.env.NP_API_KEY;
  if (!apiKey) {
    try {
      const data = await getAppData();
      apiKey = data?.npConfig?.apiKey;
    } catch {}
  }
  if (!apiKey) {
    apiKey = '587dc77f71fef7624b1e66296cc3c28b';
  }

  const body = { apiKey, modelName: method, calledMethod, methodProperties };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.success) {
    const errMsg = data.errors?.[0] || 'Unknown NP API error';
    throw new Error(errMsg);
  }
  return data.data;
}

export async function searchCities(query) {
  return npRequest('Address', 'getCities', {
    FindByString: query,
    Page: '1',
    Limit: '20',
  });
}

export async function getWarehouses(cityRef, query = '') {
  return npRequest('AddressGeneral', 'getWarehouses', {
    CityRef: cityRef,
    FindByString: query,
    Page: '1',
    Limit: '250',
  });
}

export async function getDeliveryCost(citySenderRef, cityRecipientRef, weightKg, declaredCost) {
  const data = await npRequest('InternetDocument', 'getDocumentPrice', {
    CitySender: citySenderRef,
    CityRecipient: cityRecipientRef,
    Weight: String(weightKg),
    Cost: String(declaredCost),
    ServiceType: 'WarehouseWarehouse',
  });
  return data[0]?.Cost ? Number(data[0].Cost) : null;
}

export async function createShipment({
  citySenderRef, senderRef, senderAddressRef, contactSenderRef, senderPhone,
  cityRecipientRef, recipientRef, recipientAddressRef, contactRecipientRef, recipientsPhone,
  weightKg, declaredCost, description, seatsAmount = '1',
  payerType = 'Recipient', paymentMethod = 'Cash', serviceType = 'WarehouseWarehouse',
}) {
  const data = await npRequest('InternetDocument', 'save', {
    NewAddress: '1',
    PayerType: payerType,
    PaymentMethod: paymentMethod,
    CargoType: 'Cargo',
    VolumeGeneral: '0.1',
    Weight: String(weightKg),
    ServiceType: serviceType,
    SeatsAmount: seatsAmount,
    Description: description || 'Одяг',
    Cost: String(declaredCost),
    CitySender: citySenderRef,
    Sender: senderRef,
    SenderAddress: senderAddressRef,
    ContactSender: contactSenderRef,
    SendersPhone: senderPhone,
    CityRecipient: cityRecipientRef,
    Recipient: recipientRef,
    RecipientAddress: recipientAddressRef,
    ContactRecipient: contactRecipientRef,
    RecipientsPhone: recipientsPhone,
  });
  return data[0];
}
