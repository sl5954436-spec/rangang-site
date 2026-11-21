// POST /api/message  —— 访客提交「入缸申请」，写入 D1（公开）
// GET  /api/messages —— 后台读取留言列表（需要 x-admin-token）

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function clip(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_not_bound' }, 503);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  const name = clip(body && body.name, 40);
  const contact = clip(body && body.contact, 80);
  if (!name && !contact) return json({ ok: false, error: 'empty' }, 400);

  const type = clip(body && body.type, 40);
  const brief = clip(body && body.brief, 600);
  const createdAt = new Date().toISOString();

  try {
    await env.DB.prepare(
      'INSERT INTO messages (name, contact, type, brief, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, contact, type, brief, createdAt).run();
  } catch (err) {
    return json({ ok: false, error: 'db_error', message: String(err && err.message || err) }, 500);
  }
  return json({ ok: true, createdAt });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_not_bound' }, 503);
  if (!env.ADMIN_TOKEN || (request.headers.get('x-admin-token') || '') !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  try {
    const rows = await env.DB.prepare(
      'SELECT id, name, contact, type, brief, created_at FROM messages ORDER BY created_at DESC LIMIT 200'
    ).all();
    return json({ ok: true, items: rows.results || [] });
  } catch (err) {
    return json({ ok: false, error: 'db_error', message: String(err && err.message || err) }, 500);
  }
}

// DELETE /api/message?id=1  删除单条；?all=1 清空
export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_not_bound' }, 503);
  if (!env.ADMIN_TOKEN || (request.headers.get('x-admin-token') || '') !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  const url = new URL(request.url);
  try {
    if (url.searchParams.get('all') === '1') {
      await env.DB.prepare('DELETE FROM messages').run();
      return json({ ok: true, cleared: true });
    }
    const id = Number(url.searchParams.get('id'));
    if (!id) return json({ ok: false, error: 'bad_id' }, 400);
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return json({ ok: true, id });
  } catch (err) {
    return json({ ok: false, error: 'db_error', message: String(err && err.message || err) }, 500);
  }
}
