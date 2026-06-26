import { initDb } from '../lib/db.js';

export default async function handler(req, res) {
  const supaUrl = process.env.SUPA_URL;
  const supaKey = process.env.SUPA_KEY;

  if (!supaUrl || !supaKey) {
    return res.json({ error: 'SUPA_URL or SUPA_KEY not set', supa_url: !!supaUrl, supa_key: !!supaKey });
  }

  const initOk = await initDb();

  let writeOk = false;
  try {
    const r = await fetch(`${supaUrl}/rest/v1/kv_store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: '_ping', value: { t: Date.now() } }),
    });
    writeOk = r.ok || r.status === 201;
  } catch {}

  let readVal = null;
  try {
    const r = await fetch(`${supaUrl}/rest/v1/kv_store?key=eq._ping&select=value`, {
      headers: { 'Accept': 'application/json', 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` },
    });
    const rows = await r.json();
    readVal = rows.length > 0 ? rows[0].value : null;
  } catch {}

  try {
    await fetch(`${supaUrl}/rest/v1/kv_store?key=eq._ping`, {
      method: 'DELETE',
      headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` },
    });
  } catch {}

  res.json({ supa_url: !!supaUrl, supa_key: !!supaKey, initDb: initOk, write: writeOk, read: readVal });
}