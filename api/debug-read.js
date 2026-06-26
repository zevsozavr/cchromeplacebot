export default async function handler(req, res) {
  const EC = process.env.EDGE_CONFIG || '';
  const M = EC.match(/edge-config\.vercel\.com\/([^?]+)\?token=(.+)/);
  const id = M?.[1] || '';
  const token = M?.[2] || '';
  const vt = process.env.VERCEL_API_TOKEN || '';

  const MGMT = 'https://api.vercel.com/v1/edge-config';
  const BASE = `https://edge-config.vercel.com/${id}`;

  const result = {
    has_id: !!id,
    has_token: !!token,
    has_vercel_token: !!vt,
    mgmt: null,
    cdn: null,
    error: null,
  };

  // Test Management API read
  if (vt) {
    try {
      const r = await fetch(`${MGMT}/${id}/items`, {
        headers: { 'Authorization': `Bearer ${vt}` },
      });
      const body = await r.json();
      result.mgmt = {
        status: r.status,
        format: Array.isArray(body.items) ? 'array' : typeof body,
        keys: Array.isArray(body.items) ? body.items.map(x => x.key) : Object.keys(body),
      };
    } catch (e) {
      result.mgmt = { error: e.message };
    }
  }

  // Test CDN read
  if (token) {
    try {
      const r = await fetch(`${BASE}/items?token=${token}`);
      const body = await r.json();
      result.cdn = {
        status: r.status,
        format: Array.isArray(body) ? 'array' : typeof body,
        keys: Array.isArray(body) ? body.map(x => x.key || '?') : Object.keys(body),
        has_app_data: Array.isArray(body)
          ? body.some(x => x.key === 'app_data')
          : !!body.app_data,
      };
    } catch (e) {
      result.cdn = { error: e.message };
    }
  }

  const data = await getViaEdgeRead(id, token, vt);
  result.getAppData = data ? { keys: Object.keys(data) } : null;

  res.json(result);
}

async function getViaEdgeRead(id, token, vt) {
  if (!id) return null;
  if (vt) {
    try {
      const r = await fetch(`https://api.vercel.com/v1/edge-config/${id}/items`, {
        headers: { 'Authorization': `Bearer ${vt}` },
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const body = await r.json();
      const flat = {};
      if (Array.isArray(body.items)) {
        for (const item of body.items) flat[item.key] = item.value;
      }
      if (flat.app_data) return flat.app_data;
      return flat;
    } catch {}
  }
  if (!token) return null;
  try {
    const r = await fetch(`https://edge-config.vercel.com/${id}/items?token=${token}`);
    if (!r.ok) return null;
    const body = await r.json();
    if (body?.app_data) return body.app_data;
    return null;
  } catch { return null; }
}