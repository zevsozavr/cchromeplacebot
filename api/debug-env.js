export default async function handler(req, res) {
  const vars = ['SUPA_URL', 'SUPA_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_URL', 'SUPABASE_KEY', 'BOT_TOKEN', 'EDGE_CONFIG',
    'VERCEL_API_TOKEN'];
  const result = {};
  for (const v of vars) result[v] = !!process.env[v];

  // Also test the actual Supabase fetch
  const supaUrl = process.env.SUPA_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPA_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  result.resolvedUrl = supaUrl ? supaUrl.slice(0, 40) + '...' : null;
  result.resolvedKey = !!supaKey;

  let dbTest = null;
  if (supaUrl && supaKey) {
    try {
      const r = await fetch(`${supaUrl}/rest/v1/kv_store?key=eq._ping&select=value`, {
        headers: { 'Accept': 'application/json', 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` },
      });
      dbTest = { status: r.status, ok: r.ok };
    } catch (e) { dbTest = { error: e.message }; }
  }

  result.dbTest = dbTest;
  res.json(result);
}