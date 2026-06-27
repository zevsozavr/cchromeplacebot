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
    const errs = [...(data.errors || []), ...(data.errorCodes || [])].filter(Boolean);
    const errMsg = errs.join('; ') || 'Unknown NP API error';
    console.error('[np] API failure:', JSON.stringify({ errors: data.errors, errorCodes: data.errorCodes, warnings: data.warnings }));
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
  cityRecipientRef, recipientAddressRef,
  recipientName, recipientsPhone,
  weightKg, declaredCost, afterpayAmount = 0, description, seatsAmount = '1',
  payerType = 'Recipient', paymentMethod = 'Cash', serviceType = 'WarehouseWarehouse',
}) {
  // Split full name into first/last for NP counterparty creation.
  const nameParts = (recipientName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Отримувач';
  const lastName = nameParts[1] || 'Отримувач';
  const middleName = nameParts[2] || '';

  const fullName = `${firstName} ${lastName}`;

  const props = {
    NewAddress: '1',
    PayerType: payerType,
    PaymentMethod: paymentMethod,
    CargoType: 'Parcel',
    VolumeGeneral: '0.1',
    Weight: String(weightKg || 0.5),
    ServiceType: serviceType,
    SeatsAmount: seatsAmount,
    Description: description || 'Одяг',
    Cost: String(declaredCost || 200),
    CitySender: citySenderRef,
    Sender: senderRef,
    SenderAddress: senderAddressRef,
    ContactSender: contactSenderRef,
    SendersPhone: senderPhone,
    CityRecipient: cityRecipientRef,
    RecipientAddress: recipientAddressRef,
    RecipientType: 'PrivatePerson',
    RecipientName: fullName,
    RecipientFirstName: firstName,
    RecipientLastName: lastName,
    RecipientMiddleName: middleName,
    RecipientsPhone: recipientsPhone,
    // Required for postomat delivery
    OptionsSeat: [{ volumetricLength: '25', volumetricWidth: '20', volumetricHeight: '10', weight: String(weightKg || 0.5) }],
  };

  // Післяплата (cash on delivery): recipient pays goods cost, money sent back to sender.
  // This is BackwardDeliveryData with CargoType 'Money' — NOT AfterPaymentOnGoodsCost
  // (which is "контроль оплати"). Recipient pays the redelivery fee.
  if (afterpayAmount > 0) {
    props.BackwardDeliveryData = [{
      PayerType: 'Recipient',
      CargoType: 'Money',
      RedeliveryString: String(afterpayAmount),
    }];
  }

  const data = await npRequest('InternetDocument', 'save', props);
  return data[0];
}
