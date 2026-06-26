import { initDb, getAppData } from '../lib/db.js';

export default async function handler(req, res) {
  const ec = process.env.EDGE_CONFIG || '';
  const ok = await initDb();
  const data = ok ? await getAppData() : null;

  res.json({
    edge_config_exists: !!ec,
    has_id: !!ec.match(/ecfg_/),
    db_connected: ok,
    has_data: !!data,
    products_count: data?.products?.length || 0,
  });
}
