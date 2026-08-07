import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { ChatUser } from "@/types/chat";

/** Returns true if this user entry has a real identity worth showing */
function isValidUser(u: ChatUser, currentUid: string): boolean {
  if (u.uid === currentUid) return false;
  if (!u.uid) return false;

  const name = (u.displayName || "").trim();
  const email = (u.email || "").trim();

  // Reject completely anonymous entries
  if (!name && !email) return false;
  // Reject the generic "User" fallback with no email identity
  if (name === "User" && !email) return false;

  return true;
}

export function useUsers(currentUid: string) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentUid) {
      setUsers([]);
      setLoading(false);
      setError(false);
      return;
    }

    let requestTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    setLoading(true);
    setError(false);

    function applyUpdate(raw: Record<string, ChatUser>) {
      if (disposed) return;
      setLoading(false);
      setError(false);
      const list: ChatUser[] = Object.values(raw)
        .map((u) => ({
          uid: u.uid,
          // Prefer real display name; fall back to email prefix; never just "User"
          displayName:
            u.displayName && u.displayName !== "User"
              ? u.displayName
              : u.email?.split("@")[0] || u.displayName || "",
          email: u.email || "",
          photoURL: u.photoURL ?? null,
          online: u.online ?? false,
          lastSeen: u.lastSeen ?? 0,
        }))
        .filter((u) => isValidUser(u, currentUid));
      setUsers(list);
    }

    function finishWithError() {
      if (disposed) return;
      setLoading(false);
      setError(true);
    }

    function requestUsers() {
      if (disposed) return;

      if (requestTimer) clearTimeout(requestTimer);
      requestTimer = setTimeout(finishWithError, 8000);

      // Keep the loading state bounded even when the initial websocket
      // handshake is blocked by a proxy or the API is temporarily down.
      if (!socket.connected) return;

      socket.emit(
        "get_users",
        {},
        (response: { users?: Record<string, ChatUser> }) => {
          if (requestTimer) clearTimeout(requestTimer);
          if (response?.users) {
            applyUpdate(response.users);
          } else {
            finishWithError();
          }
        }
      );
    }

    function handleConnect() {
      requestUsers();
    }

    function handleConnectError() {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(requestUsers, 1500);
    }

    const handleUpdate = ({ users: raw }: { users: Record<string, ChatUser> }) => {
      applyUpdate(raw);
    };

    // Register listeners before requesting the snapshot. The first
    // users_update can arrive immediately after authentication.
    socket.on("users_update", handleUpdate);
    socket.on("connect", handleConnect);
    socket.on("reconnect", handleConnect);
    socket.on("connect_error", handleConnectError);

    // The socket may already be connected when this hook mounts.
    requestUsers();

    return () => {
      disposed = true;
      if (requestTimer) clearTimeout(requestTimer);
      if (retryTimer) clearTimeout(retryTimer);
      socket.off("users_update", handleUpdate);
      socket.off("connect", handleConnect);
      socket.off("reconnect", handleConnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [currentUid]);

  return { users, loading, error };
}
