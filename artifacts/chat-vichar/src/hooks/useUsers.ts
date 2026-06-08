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

  useEffect(() => {
    if (!currentUid) return;

    function applyUpdate(raw: Record<string, ChatUser>) {
      setLoading(false);
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

    socket.emit(
      "get_users",
      {},
      (response: { users: Record<string, ChatUser> }) => {
        if (response?.users) applyUpdate(response.users);
      }
    );

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
