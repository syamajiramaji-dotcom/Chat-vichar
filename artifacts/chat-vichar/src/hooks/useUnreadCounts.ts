import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

/**
 * Returns a live map of { [senderUid]: unreadCount } for the current user.
 * Populated via Socket.io instead of Firebase.
 */
export function useUnreadCounts(currentUid: string): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUid) return;

    // Full snapshot on connect / re-auth
    const handleCounts = ({ counts: c }: { counts: Record<string, number> }) => {
      setCounts(c ?? {});
    };

    // Individual bump when a new message arrives
    const handleUpdate = ({
      senderUid,
      count,
    }: {
      senderUid: string;
      count: number;
    }) => {
      setCounts((prev) => {
        const next = { ...prev };
        if (count > 0) {
          next[senderUid] = count;
        } else {
          delete next[senderUid];
        }
        return next;
      });
    };

    socket.on("unread_counts", handleCounts);
    socket.on("unread_update", handleUpdate);
    return () => {
      socket.off("unread_counts", handleCounts);
      socket.off("unread_update", handleUpdate);
    };
  }, [currentUid]);

  return counts;
}
