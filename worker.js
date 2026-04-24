export default {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Not WebSocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    // 简单全局存储（临时用，够你用）
    globalThis.clients = globalThis.clients || [];
    globalThis.clients.push(server);

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

        // 广播给所有连接
        globalThis.clients.forEach(ws => {
          try {
            ws.send(msg);
          } catch {}
        });
      }
    });

    server.addEventListener("close", () => {
      globalThis.clients = globalThis.clients.filter(ws => ws !== server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};
