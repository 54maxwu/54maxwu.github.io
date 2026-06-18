// bomb-signal —— 炸彈人專用的 WebSocket 房間中轉 Worker（最多 4 人/房）
// 與原本的 pingl-signal 完全獨立，不會互相影響。
// 用法：WebSocket 連到 wss://<worker>/room/<房號>
//   收到的控制訊息：{type:'room-state',peerCount} / {type:'peer-joined'} /
//                   {type:'peer-left'} / {type:'room-full'}
//   其餘訊息（遊戲輸入/狀態）原封不動轉發給同房其他人。

export class Room {
  constructor(state, env){ this.sessions = new Set(); }

  async fetch(request){
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('expected websocket', { status: 426 });

    const MAX = 8;                         // 每房上限連線數（派對大螢幕：主機+最多4支手機=5，留餘裕）
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();

    if (this.sessions.size >= MAX){
      try { server.send(JSON.stringify({ type: 'room-full' })); server.close(1013, 'room full'); } catch (e) {}
      return new Response(null, { status: 101, webSocket: client });
    }

    this.sessions.add(server);
    // 告訴新加入者：房內已有幾位（不含自己）
    try { server.send(JSON.stringify({ type: 'room-state', peerCount: this.sessions.size - 1 })); } catch (e) {}
    // 通知其他人：有人加入
    this.broadcast(server, JSON.stringify({ type: 'peer-joined' }));

    // 轉發遊戲訊息給同房其他人
    server.addEventListener('message', ev => this.broadcast(server, ev.data));

    const bye = () => {
      if (this.sessions.delete(server))
        this.broadcast(null, JSON.stringify({ type: 'peer-left' }));
    };
    server.addEventListener('close', bye);
    server.addEventListener('error', bye);

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(except, data){
    for (const ws of this.sessions){
      if (ws === except) continue;
      try { ws.send(data); } catch (e) { this.sessions.delete(ws); }
    }
  }
}

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/room\/(.+)$/);
    if (!m) return new Response('bomb-signal OK — 用 WebSocket 連到 /room/<房號>', { status: 200 });
    const stub = env.ROOM.get(env.ROOM.idFromName(decodeURIComponent(m[1])));
    return stub.fetch(request);
  }
};
