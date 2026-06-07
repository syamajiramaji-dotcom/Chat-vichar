import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * Returns a live map of { [senderUid]: unreadCount } for the current user.
 * Listens to `unread/{currentUid}` in Firebase Realtime Database.
 */
export function useUnreadCounts(currentUid: string): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUid) return;
    const unreadRef = ref(db, `unread/${currentUid}`);
    const unsub = onValue(unreadRef, (snap) => {
      if (!snap.exists()) {
        setCounts({});
        return;
      }
      const raw = snap.val() as Record<string, number>;
      // Only keep senders that have at least 1 unread message
      const filtered: Record<string, number> = {};
      for (const [uid, count] of Object.entries(raw)) {
        if (count > 0) filtered[uid] = count;
      }
      setCounts(filtered);
    });
    return unsub;
  }, [currentUid]);

  return counts;
}
