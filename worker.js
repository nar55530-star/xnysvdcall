export class DanmuRoom {
  constructor(state, env) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();
    this.sessions.add(server);

    server.addEventListener("message", (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === "danmu" && data.text) {
        const msg = JSON.stringify({
          type: "danmu",
          text: String(data.text).slice(0, 30),
          time: Date.now()
        });

        for (const ws of this.sessions) {
          try {
            ws.send(msg);
          } catch {}
        }
      }
    });

    server.addEventListener("close", () => {
      this.sessions.delete(server);
    });

    server.addEventListener("error", () => {
      this.sessions.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}

export default {
  async fetch(request, env) {
    const id = env.DANMU_ROOM.idFromName("xuniyusheng-room");
    const room = env.DANMU_ROOM.get(id);
    return room.fetch(request);
  }
};