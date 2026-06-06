import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { ChatUser } from "@/types/chat";

export function useUsers(currentUid: string) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) return;

    const usersRef = ref(db, "users");
    const unsub = onValue(
      usersRef,
      (snap) => {
        setLoading(false);
        if (!snap.exists()) {
          setUsers([]);
          return;
        }

        // Use entries so the Firebase key is always the uid — even if the stored
        // object was written without an explicit uid field.
        const raw = snap.val() as Record<string, Partial<ChatUser>>;
        const list: ChatUser[] = Object.entries(raw)
          .map(([key, val]) => ({
            uid: val.uid || key,                          // Firebase key is ground truth
            displayName: val.displayName || val.email?.split("@")[0] || "User",
            email: val.email || "",
            photoURL: val.photoURL || null,
            online: val.online ?? false,
            lastSeen: val.lastSeen ?? 0,
          }))
          .filter((u) => u.uid !== currentUid);

        setUsers(list);
      },
      (error) => {
        console.error("useUsers error:", error);
        setLoading(false);
      }
    );

    return unsub;
  }, [currentUid]);

  return { users, loading };
}
