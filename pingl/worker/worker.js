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
    if (this.sockets.size >= 2) {
      return new Response('room full', { status: 403 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    // Tell the new socket how many peers were already present
    // (excluding itself). If >= 1, the sender knows it can start offering.
    server.send(JSON.stringify({ type: 'room-state', peerCount: this.sockets.size }));

    // Notify existing peers about the new arrival.
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

    if (parts[0] !== 'room' || !parts[1]) {
      return new Response('use /room/<id>', { status: 400, headers: CORS });
    }

    const roomId = parts[1];
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(roomId)) {
      return new Response('invalid room id', { status: 400, headers: CORS });
    }

    const id = env.ROOMS.idFromName(roomId);
    const stub = env.ROOMS.get(id);
    return stub.fetch(req);
  },
};
