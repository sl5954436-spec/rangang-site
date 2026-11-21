// GET /media/<key> —— 从 R2 读媒体文件（公开、长缓存、支持 Range 便于视频拖动）

export async function onRequestGet({ request, params, env }) {
  if (!env.MEDIA) return new Response('R2 not bound', { status: 503 });

  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!key) return new Response('not found', { status: 404 });

  const rangeHeader = request.headers.get('range');
  const obj = await env.MEDIA.get(key, rangeHeader ? { range: request.headers } : undefined);
  if (!obj) return new Response('not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  if (rangeHeader && obj.range) {
    const offset = obj.range.offset || 0;
    const length = obj.range.length || 0;
    headers.set('content-range', 'bytes ' + offset + '-' + (offset + length - 1) + '/' + obj.size);
    headers.set('content-length', String(length));
    return new Response(obj.body, { status: 206, headers });
  }

  return new Response(obj.body, { headers });
}
