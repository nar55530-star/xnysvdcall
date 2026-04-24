export class DanmuRoom {
  constructor(state, env) {
    this.state = state;
    this.sessions = [];
  }

  async fetch(request) {
    // 必须是 WebSocket 请求
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();
    this.sessions.push(server);

    server.addEventListener("message", (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === "danmu") {
        const msg = JSON.stringify({
          type: "danmu",
          text: data.text
        });

        // 广播给所有人
        this.sessions.forEach(ws => {
          try {
            ws.send(msg);
          } catch {}
        });
      }
    });

    server.addEventListener("close", () => {
      this.sessions = this.sessions.filter(ws => ws !== server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}

export default {
  fetch(request, env) {
    const id = env.DANMU_ROOM.idFromName("room1");
    return env.DANMU_ROOM.get(id).fetch(request);
  }
};
