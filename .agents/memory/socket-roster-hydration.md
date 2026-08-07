---
name: Socket roster hydration
description: Realtime user-list loading depends on listener ordering, direct post-auth hydration, and explicit proxy routing.
---

The roster flow must register its `users_update` and connection listeners before requesting the initial snapshot. The server should emit the authenticated user's snapshot directly as well as broadcasting it, because a new client can miss a broadcast during React mount. Socket.IO paths must be explicitly included in the web artifact's proxy routes; otherwise the websocket handshake can be silently dropped.

**Why:** A connected client can authenticate successfully while the contacts hook waits forever if it misses the first broadcast or if `/api/socket.io` is not forwarded. A bounded timeout/error state is preferable to an infinite skeleton.

**How to apply:** For any realtime list hook, hydrate on connect/reconnect, keep the initial request bounded with a retry/error path, and verify both the browser proxy route and the API server's Socket.IO path.