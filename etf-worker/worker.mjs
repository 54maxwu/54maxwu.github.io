// CORS relay for ETF進場觀測站.html — only whitelisted market-data hosts, GET only.
// Usage: https://etf-proxy.<account>.workers.dev/?url=<encoded target URL>
const HOSTS = {
  'mis.twse.com.tw': { referer: 'https://mis.twse.com.tw/stock/index.jsp', ttl: 0 },
  'www.twse.com.tw': { referer: 'https://www.twse.com.tw/', ttl: 600 },
  'query1.finance.yahoo.com': { referer: null, ttl: 120 },
  'query2.finance.yahoo.com': { referer: null, ttl: 120 },
};
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' };
const fail = (status, message) => new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return fail(405, 'GET only');
    let target;
    try { target = new URL(new URL(request.url).searchParams.get('url') || ''); } catch { return fail(400, 'missing or invalid url'); }
    const rule = HOSTS[target.hostname];
    if (target.protocol !== 'https:' || !rule) return fail(403, 'host not allowed');
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'Accept': 'application/json,text/plain,*/*', 'Accept-Language': 'zh-TW,zh;q=0.9' };
    if (rule.referer) headers.Referer = rule.referer;
    const cache = caches.default, key = new Request(target.toString());
    if (rule.ttl) { const hit = await cache.match(key); if (hit) return hit; }
    let upstream;
    try { upstream = await fetch(target.toString(), { headers, redirect: 'follow', signal: AbortSignal.timeout(20000) }); }
    catch (e) { return fail(502, 'upstream fetch failed: ' + e.message); }
    const response = new Response(upstream.body, { status: upstream.status, headers: { ...cors, 'Content-Type': upstream.headers.get('Content-Type') || 'application/json', 'Cache-Control': rule.ttl ? 'public, max-age=' + rule.ttl : 'no-store', 'X-Upstream-Status': String(upstream.status) } });
    if (rule.ttl && upstream.ok) ctx.waitUntil(cache.put(key, response.clone()));
    return response;
  },
};
