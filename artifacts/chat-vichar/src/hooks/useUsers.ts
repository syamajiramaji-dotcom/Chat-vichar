import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { ChatUser } from "@/types/chat";

export function useUsers(currentUid: string) {
  const [users, setUsers] = useState<ChatUser[]>([]);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, ChatUser>;
      const list = Object.values(data).filter((u) => u.uid !== currentUid);
      setUsers(list);
    });
    return unsub;
  }, [currentUid]);

  return users;
}
