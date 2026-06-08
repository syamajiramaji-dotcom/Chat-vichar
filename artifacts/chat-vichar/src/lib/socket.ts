import { io, type Socket } from "socket.io-client";

// Singleton socket — shared across all hooks
const socket: Socket = io({
  path: "/api/socket.io",
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export interface AuthPayload {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

let lastAuth: AuthPayload | null = null;

// Re-authenticate on every reconnect so rooms are rejoined
socket.on("connect", () => {
  if (lastAuth) {
    socket.emit("authenticate", lastAuth);
  }
});

export function connectSocket(payload: AuthPayload) {
  lastAuth = payload;
  if (!socket.connected) {
    socket.connect();
  } else {
    socket.emit("authenticate", payload);
  }
}

export function disconnectSocket() {
  lastAuth = null;
  socket.disconnect();
}

export { socket };
