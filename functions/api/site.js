// GET  /api/site   —— 读取站点内容（公开）
// PUT  /api/site   —— 保存站点内容（需要 x-admin-token）

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function unauthorized() {
  return json({ ok: false, error: 'unauthorized' }, 401);
}

function tokenOf(request) {
  return request.headers.get('x-admin-token') || '';
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok: false, error: 'db_not_bound' }, 503);
  try {
    const row = await env.DB.prepare('SELECT json, updated_at FROM site_data WHERE id = 1').first();
    if (!row) return json({ ok: true, data: null, updatedAt: null });
    let data = null;
    try {
      data = JSON.parse(row.json);
    } catch (e) {
      return json({ ok: false, error: 'data_corrupted' }, 500);
    }
    return json({ ok: true, data, updatedAt: row.updated_at });
  } catch (err) {
    return json({ ok: false, error: 'db_error', message: String(err && err.message || err) }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_not_bound' }, 503);
  if (!env.ADMIN_TOKEN || tokenOf(request) !== env.ADMIN_TOKEN) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ ok: false, error: 'bad_payload' }, 400);
  }

  const text = JSON.stringify(body);
  if (text.length > 1024 * 1024) {
    return json({ ok: false, error: 'too_large', limit: '1MB' }, 413);
  }

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      'INSERT INTO site_data (id, json, updated_at) VALUES (1, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at'
    ).bind(text, now).run();
  } catch (err) {
    return json({ ok: false, error: 'db_error', message: String(err && err.message || err) }, 500);
  }
  return json({ ok: true, updatedAt: now, bytes: text.length });
}
