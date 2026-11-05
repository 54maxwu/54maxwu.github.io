const trusted = new Set(['https://kd88.com', 'https://www.kd88.com', 'https://54maxwu.github.io']);
const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };

function originAllowed(origin) {
  if (trusted.has(origin)) return true;
  try { return ['localhost', '127.0.0.1'].includes(new URL(origin).hostname); }
  catch { return false; }
}

async function turn(env, authorization) {
  if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN || !env.RELAY_PASSCODE)
    return new Response(null, { status: 503, headers });
  const encoder = new TextEncoder();
  const digest = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  const [provided, expected] = await Promise.all([digest(authorization ?? ''), digest('Bearer ' + env.RELAY_PASSCODE)]);
  if (!crypto.subtle.timingSafeEqual(provided, expected))
    return new Response(null, { status: 403, headers });
  try {
    const result = await fetch(
      'https://rtc.live.cloudflare.com/v1/turn/keys/' + encodeURIComponent(env.TURN_KEY_ID) + '/credentials/generate-ice-servers',
      { method: 'POST', headers: { Authorization: 'Bearer ' + env.TURN_API_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 600 }), signal: AbortSignal.timeout(8000) }
    );
    if (!result.ok) throw Error();
    const { iceServers } = await result.json();
    const servers = (Array.isArray(iceServers) ? iceServers : [iceServers]).map(server => ({
      ...server, urls: [server.urls].flat().filter(url => /^(turn|turns):/.test(url) && !/:53(?:\?|$)/.test(url))
    })).filter(server => server.urls.length);
    if (!servers.length) throw Error();
    return new Response(JSON.stringify({ iceServers: servers }), { headers });
  } catch {
    return new Response(null, { status: 502, headers });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return Response.redirect(new URL('/transfer/', url), 302);
    if (url.pathname === '/tool.htm') return Response.redirect('https://kd88.com/tool.htm', 302);
    if (url.pathname === '/health') return new Response('quick-transfer OK');
    const origin = request.headers.get('Origin');
    if (origin !== url.origin && !originAllowed(origin)) return new Response(null, { status: 403 });
    if (url.pathname === '/turn') {
      const cors = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
        ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization'
      } });
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      const result = await turn(env, request.headers.get('Authorization'));
      for (const [key, value] of Object.entries(cors)) result.headers.set(key, value);
      return result;
    }
    const match = /^\/room\/([0-9A-HJKMNP-TV-Z]{20})$/.exec(url.pathname);
    if (!match) return new Response(null, { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
      return new Response(null, { status: 426 });
    return env.ROOM.get(env.ROOM.idFromName(match[1])).fetch(request);
  }
};

export class Room {
  constructor(ctx) { this.ctx = ctx; }

  fetch() {
    const peers = this.ctx.getWebSockets();
    const [client, server] = Object.values(new WebSocketPair());
    if (peers.length >= 2) {
      server.accept();
      server.send('{"type":"full"}');
      server.close(1008, 'Room full');
    } else {
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ sent: false });
      server.send('{"type":"ready"}');
      if (peers.length) {
        peers[0].serializeAttachment({ sent: false, role: 'offer' });
        server.serializeAttachment({ sent: false, role: 'answer' });
        peers[0].send('{"type":"pair","offer":true}');
        server.send('{"type":"pair","offer":false}');
      }
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, message) {
    const peer = this.ctx.getWebSockets().find(other => other !== ws);
    if (!peer || typeof message !== 'string' || message.length > 32768) return;
    const state = ws.deserializeAttachment();
    if (!state?.role || state.sent) return;
    try {
      const { type, sdp } = JSON.parse(message);
      if (type !== state.role || typeof sdp !== 'string' || !sdp.startsWith('v=0')) return;
      ws.serializeAttachment({ ...state, sent: true });
      peer.send(JSON.stringify({ type, sdp }));
    } catch { /* Ignore invalid signals. */ }
  }

  webSocketClose(ws) {
    try { ws.close(); } catch { /* Already closed. */ }
    for (const peer of this.ctx.getWebSockets()) {
      if (peer === ws) continue;
      try {
        peer.serializeAttachment({ sent: false });
        peer.send('{"type":"left"}');
      } catch { /* Peer also left. */ }
    }
  }

  webSocketError(ws) { this.webSocketClose(ws); }
}
