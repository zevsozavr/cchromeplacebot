import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (!uri) {
    console.log('MongoDB: no URI configured');
    return null;
  }
  if (cachedDb) return cachedDb;
  try {
    console.log('MongoDB: attempting connection...');
    cachedClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      tls: true,
      tlsAllowInvalidHostnames: true,
      tlsInsecure: true,
    });
    await cachedClient.connect();
    cachedDb = cachedClient.db('cchromeplace');
    console.log('MongoDB: connected successfully');
    return cachedDb;
  } catch (err) {
    const errMsg = err?.message ? err.message.substring(0, 500) : String(err);
    const errName = err?.name || '';
    console.error('MongoDB: connection error', JSON.stringify({ name: errName, message: errMsg }));
    return null;
  }
}

const DEFAULT_DATA = {
  products: [],
  orders: [],
  collection: { enabled: false, image: '', title: '', subtitle: '', tag: '' },
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
