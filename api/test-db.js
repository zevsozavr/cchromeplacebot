import { connectToDatabase } from '../lib/db.js';

export default async function handler(req, res) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return res.json({ error: 'MONGODB_URI not set' });

  // Show first 30 chars of the URI to verify it's loaded (hiding password)
  const masked = uri.slice(0, 20) + '...' + uri.slice(uri.indexOf('@'));
  
  const db = await connectToDatabase();
  res.json({
    uri_exists: !!uri,
    uri_prefix: masked,
    db_connected: !!db,
  });
}
