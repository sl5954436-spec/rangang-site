// POST /api/upload —— 上传图片/视频到 R2，返回可访问路径
// 需要 x-admin-token，且站点已绑定 R2 桶（变量 MEDIA）

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function safeName(name) {
  return String(name || 'file')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
    .replace(/\s+/g, '-')
    .slice(-80);
}

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return json({ ok: false, error: 'r2_not_bound' }, 503);
  if (!env.ADMIN_TOKEN || (request.headers.get('x-admin-token') || '') !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ ok: false, error: 'bad_form' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ ok: false, error: 'no_file' }, 400);

  const maxBytes = 60 * 1024 * 1024;
  if (file.size > maxBytes) return json({ ok: false, error: 'too_large', limit: '60MB' }, 413);

  const name = safeName(file.name);
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const key = 'assets/' + base + '-' + Date.now().toString(36).slice(-6) + ext;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  return json({ ok: true, key, path: '/media/' + key, size: file.size });
}
