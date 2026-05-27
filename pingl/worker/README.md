# pingl-signal Worker

Cloudflare Worker that provides WebRTC signaling rooms for `pingl/index.htm`.
Each room is a Durable Object that relays SDP / ICE between exactly two peers.

Endpoints:
- `GET  /health`         — health check
- `GET  /room/<id>`      — WebSocket upgrade, joins/creates a 2-peer room

## 部署

```powershell
wrangler deploy
```

## 看 Log

```powershell
wrangler tail
```
