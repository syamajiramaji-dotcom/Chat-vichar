import { io, type Socket } from "socket.io-client";

// When deploying the frontend to a static host (e.g. Cloudflare Pages),
// set VITE_API_URL to the full URL of your API server, e.g.:
//   VITE_API_URL=https://api.your-domain.com
// Leave it unset (or empty) when the API and frontend share the same origin.
const API_URL = import.meta.env.VITE_API_URL;

const socket: Socket = API_URL
  ? io(API_URL, {
      path: "/api/socket.io",
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })
  : io({
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
