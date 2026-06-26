import { initDb } from '../lib/db.js';

export default async function handler(req, res) {
  const ec = process.env.EDGE_CONFIG || '';
  await initDb();

  res.json({
    edge_config_exists: !!ec,
    has_id: !!ec.match(/ecfg_/),
    has_token: !!process.env.VERCEL_API_TOKEN,
    db_connected: true,
  });
}
