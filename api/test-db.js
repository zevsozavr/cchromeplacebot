import { initDb, edgeWrite } from '../lib/db.js';

export default async function handler(req, res) {
  const ec = process.env.EDGE_CONFIG || '';
  const token = !!process.env.VERCEL_API_TOKEN;
  await initDb();

  // Clean up test artifacts
  await edgeWrite('app_data', { products: [] });
  await edgeWrite('_test', null);
  await edgeWrite('_testdebug', null);

  res.json({
    edge_config: !!ec,
    has_token: token,
    cleaned: true,
  });
}
