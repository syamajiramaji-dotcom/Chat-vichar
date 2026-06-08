import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { ChatUser } from "@/types/chat";

export function useUsers(currentUid: string) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) return;

    function applyUpdate(raw: Record<string, ChatUser>) {
      setLoading(false);
      const list: ChatUser[] = Object.values(raw)
        .map((u) => ({
          uid: u.uid,
          displayName: u.displayName || u.email?.split("@")[0] || "User",
          email: u.email || "",
          photoURL: u.photoURL ?? null,
          online: u.online ?? false,
          lastSeen: u.lastSeen ?? 0,
        }))
        .filter((u) => u.uid !== currentUid);
      setUsers(list);
    }

    // Request roster immediately (in case authenticate already fired)
    socket.emit(
      "get_users",
      {},
      (response: { users: Record<string, ChatUser> }) => {
        if (response?.users) applyUpdate(response.users);
      }
    );

    // Keep roster live — server emits this on every connect/disconnect
    const handleUpdate = ({ users: raw }: { users: Record<string, ChatUser> }) => {
      applyUpdate(raw);
    };

    socket.on("users_update", handleUpdate);
    return () => {
      socket.off("users_update", handleUpdate);
    };
  }, [currentUid]);

  return { users, loading };
}
