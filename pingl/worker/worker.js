// pin.gl-style WebRTC signaling server + Tool Hub LINKS provider.
//
// Routes:
//   GET  /health         — health check
//   POST /links          — body: { password }; returns LINKS array if password verifies
//   GET  /room/<id>      — WebSocket upgrade, joins/creates a 2-peer room

// ── Auth: RSA-PSS signature verification (same as old client-side login) ──
const PUB_KEY_B64 = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmGXhsEcms3FNOxkRBSd2FmBaU8xo6WwRIkdPIjVoZYzvwTyXun0rpVHBNITO7bt/zAKNT+/3m5xwFSEtJflxjMVumW1Ci8IB1YyH+5O1sxweSOivHXFRoRteHRiYYQwf697EPdBMX1MZnsBhp05uH6EpOKfxII3mDldNlSN564ueiXVrKodzcOncK4/RG1c5TSNroYZCcpk4Vq5EemZsMbmhrklRFipB4fDPag6kPKlLME64Xl97gTkAJU1xr0lVqkeWrSQPy6f990tPlxKYtg12cIWLeo6cHhCSyt1yFD6kO0yk08fW8uo+8iqMj4ELz8beC1OsxKOvz+6Z4awnVQIDAQAB';
const SIG_B64     = 'WfkbK13IFfxAcJLWmRi1+Y2ak9Y4UlTRqcceWrYT0+5yZtPjgNrO6bWPdsguaH7cX4wEGVAN7b0J94AvBv7gjNcurX/y9XcMiGk54KwUl68Zc7FZ1xKINtrRTbpDI/pEIJ5z7slhR3aGNjkixfyE65b9J3z8p814CeOjCCeL6yopcVPGLZcjDtoeWaG8CRY+UC0cMs6YW2Pc5zJnvqsmrahkEUnVS6Pwbe7uLUPATFy+JH+gWIH/8kf8CBHd/k3oMb9tkjXTVL0Eq1IIqLEERynt/YiGjqwBn9YVgaeteW6hF8FGqCUzrHKDd9BUMsRtFpNhZ6g4Qw3WKkJKhfX4ew==';
const SALT_LEN    = 32;

function b64ToBytes(b64) {
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function verifyPassword(password) {
  const keyData = b64ToBytes(PUB_KEY_B64);
  const pubKey  = await crypto.subtle.importKey(
    'spki', keyData,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false, ['verify']
  );
  const sig  = b64ToBytes(SIG_B64);
  const data = new TextEncoder().encode(password);
  return crypto.subtle.verify(
    { name: 'RSA-PSS', saltLength: SALT_LEN },
    pubKey, sig, data
  );
}

// ── WebRTC signaling room ─────────────────────────────
export class Room {
  constructor(state, env) {
    this.state = state;
    this.sockets = new Set();
  }

  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket upgrade', { status: 426 });
    }
    if (this.sockets.size >= 2) {
      return new Response('room full', { status: 403 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();
    server.send(JSON.stringify({ type: 'room-state', peerCount: this.sockets.size }));

    for (const s of this.sockets) {
      try { s.send(JSON.stringify({ type: 'peer-joined' })); } catch {}
    }

    this.sockets.add(server);

    server.addEventListener('message', e => {
      for (const s of this.sockets) {
        if (s !== server) {
          try { s.send(e.data); } catch {}
        }
      }
    });

    const close = () => {
      if (!this.sockets.has(server)) return;
      this.sockets.delete(server);
      for (const s of this.sockets) {
        try { s.send(JSON.stringify({ type: 'peer-left' })); } catch {}
      }
    };
    server.addEventListener('close', close);
    server.addEventListener('error', close);

    return new Response(null, { status: 101, webSocket: client });
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] === 'health') {
      return new Response('ok', { headers: { ...CORS, 'content-type': 'text/plain' } });
    }

    if (parts[0] === 'links') {
      if (req.method !== 'POST') {
        return new Response('use POST', { status: 405, headers: CORS });
      }
      let body;
      try { body = await req.json(); }
      catch { return new Response('bad json', { status: 400, headers: CORS }); }
      const password = body?.password;
      if (typeof password !== 'string' || !password) {
        return new Response('missing password', { status: 400, headers: CORS });
      }
      const ok = await verifyPassword(password);
      if (!ok) {
        // Slow down brute force attempts
        await new Promise(r => setTimeout(r, 800));
        return new Response('unauthorized', { status: 401, headers: CORS });
      }
      let linksJson = null;
      if (env.LINKS_KV) {
        try { linksJson = await env.LINKS_KV.get('links'); } catch {}
      }
      if (!linksJson) linksJson = env.LINKS_JSON || '[]';  // legacy fallback
      return new Response(linksJson, {
        status: 200,
        headers: { ...CORS, 'content-type': 'application/json' },
      });
    }

    if (parts[0] === 'room' && parts[1]) {
      const roomId = parts[1];
      if (!/^[a-zA-Z0-9_-]{1,32}$/.test(roomId)) {
        return new Response('invalid room id', { status: 400, headers: CORS });
      }
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);
      return stub.fetch(req);
    }

    return new Response('not found', { status: 404, headers: CORS });
  },
};
