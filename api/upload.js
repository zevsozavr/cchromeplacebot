const SUPA_URL = process.env.SUPA_URL || process.env.VITE_SUPABASE_URL;
const SUPA_KEY = process.env.SUPA_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'product-images';

async function ensureBucket() {
  const headers = { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };
  const check = await fetch(`${SUPA_URL}/storage/v1/bucket/${BUCKET}`, { headers });
  if (check.ok) return true;
  // Create a public bucket if it doesn't exist yet
  const create = await fetch(`${SUPA_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  return create.ok || create.status === 409; // 409 = already exists
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SUPA_URL || !SUPA_KEY) return res.status(503).json({ error: 'Storage not configured' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
    const dataUrl = body?.dataUrl;
    if (!dataUrl || typeof dataUrl !== 'string') return res.status(400).json({ error: 'Missing dataUrl' });

    const m = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'Invalid image data' });
    const contentType = m[1];
    const buffer = Buffer.from(m[2], 'base64');
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg').replace('+xml', '');

    await ensureBucket();

    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    });
    if (!up.ok) {
      const txt = await up.text().catch(() => '');
      return res.status(502).json({ error: 'Upload failed', status: up.status, detail: txt });
    }

    const url = `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
