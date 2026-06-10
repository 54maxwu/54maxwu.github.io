// pin.gl-style WebRTC signaling server.
// One Durable Object per room. Relays SDP offer/answer and ICE candidates
// between exactly two peers (sender + viewer). 3rd connection is rejected.

export class Room {
  constructor(state, env) {
    this.state = state;
    this.sockets = new Set();
  }

  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket upgrade', { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    // Room holds at most 2 peers. A 3rd connection is accepted only long enough
    // to tell the client the room is full (so it can show a clear message), then
    // closed. Returning a 403 before the upgrade would arrive as an opaque socket
    // error the browser can't distinguish from a network failure.
    if (this.sockets.size >= 2) {
      try { server.send(JSON.stringify({ type: 'room-full', max: 2 })); } catch {}
      // 4001: app-defined close code so the client can also detect full-on-close.
      try { server.close(4001, 'room full'); } catch {}
      return new Response(null, { status: 101, webSocket: client });
    }

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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Upgrade, Connection',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] === 'health') {
      return new Response('ok', { headers: { ...CORS, 'content-type': 'text/plain' } });
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
