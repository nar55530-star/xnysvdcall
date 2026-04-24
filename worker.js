export class DanmuRoom {
  constructor(state, env) {
    this.state = state;
    this.clients = new Set();
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();
    this.clients.add(server);

    server.addEventListener("message", (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === "danmu") {
        const msg = JSON.stringify(data);

        // 广播给所有连接
        for (const ws of this.clients) {
          try {
            ws.send(msg);
          } catch {}
        }
      }
    });

    server.addEventListener("close", () => {
      this.clients.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}

export default {
  fetch(request, env) {
    // ⭐⭐⭐ 固定唯一房间（关键！！！）
    const id = env.DANMU_ROOM.idFromName("fixed-room-001");

    return env.DANMU_ROOM.get(id).fetch(request);
  }
};
