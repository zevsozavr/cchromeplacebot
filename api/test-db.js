import { initDb } from '../lib/db.js';

export default async function handler(req, res) {
  const supaUrl = process.env.SUPA_URL;
  const supaKey = process.env.SUPA_KEY;

  if (!supaUrl || !supaKey) {
    return res.json({ error: 'SUPA_URL or SUPA_KEY not set', supa_url: !!supaUrl, supa_key: !!supaKey });
  }

  const initOk = await initDb();

  let writeStatus = null;
  let writeBody = null;
  try {
    const r = await fetch(`${supaUrl}/rest/v1/kv_store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: '_ping', value: { t: Date.now() } }),
    });
    writeStatus = r.status;
    try { writeBody = await r.text(); } catch {}
  } catch (e) { writeBody = e.message; }

  let readVal = null;
  let readStatus = null;
  try {
    const r = await fetch(`${supaUrl}/rest/v1/kv_store?key=eq._ping&select=value`, {
      headers: { 'Accept': 'application/json', 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` },
    });
    readStatus = r.status;
    if (r.ok) { const rows = await r.json(); readVal = rows.length > 0 ? rows[0].value : null; }
  } catch {}

  try {
    await fetch(`${supaUrl}/rest/v1/kv_store?key=eq._ping`, {
      method: 'DELETE',
      headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` },
    });
  } catch {}

  res.json({ supa_url: !!supaUrl, supa_key: !!supaKey, initDb: initOk, writeStatus, writeBody, readStatus, readVal });
}