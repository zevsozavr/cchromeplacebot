import { initDb, getAppData } from '../lib/db.js';

export default async function handler(req, res) {
  const hasUrl = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  const ok = await initDb();
  const data = ok ? await getAppData() : null;
  res.json({
    db_configured: hasUrl,
    db_connected: ok,
    has_data: !!data,
  });
}
