import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (!uri) return null;
  if (cachedDb) return cachedDb;
  try {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
    cachedDb = cachedClient.db('cchromeplace');
    return cachedDb;
  } catch {
    return null;
  }
}

const DEFAULT_DATA = {
  products: [],
  orders: [],
  collection: { enabled: false, image: '', title: '', subtitle: '', tag: '' },
  shipping: { novaPoshtaPrice: 100, freeShippingThreshold: 3000 },
  deals: [],
};

export async function getAppData() {
  const db = await connectToDatabase();
  if (!db) return null;
  const doc = await db.collection('app_data').findOne({ _id: 'main' });
  return doc ? { ...DEFAULT_DATA, ...doc, _id: undefined } : { ...DEFAULT_DATA };
}

export async function saveAppData(data) {
  const db = await connectToDatabase();
  if (!db) return false;
  await db.collection('app_data').updateOne(
    { _id: 'main' },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  return true;
}
