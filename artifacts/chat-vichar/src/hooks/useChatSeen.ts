import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

/**
 * - Emits `mark_seen` when a chat is opened (tells server the current user saw it).
 * - Listens for `seen_update` to know when the *recipient* opens our chat.
 * - Returns the timestamp (ms) when the recipient last saw this chat.
 */
export function useChatSeen(
  chatId: string | null,
  currentUid: string,
  recipientUid: string
): number {
  const [recipientSeenAt, setRecipientSeenAt] = useState(0);

  useEffect(() => {
    if (!chatId || !currentUid || !recipientUid) return;

    // Tell the server (and the other participant) that we've seen this chat
    socket.emit("mark_seen", { chatId, senderUid: recipientUid });

    // Listen for the other person opening our messages
    const handleSeenUpdate = ({
      chatId: id,
      uid,
      seenAt,
    }: {
      chatId: string;
      uid: string;
      seenAt: number;
    }) => {
      if (id !== chatId || uid !== recipientUid) return;
      setRecipientSeenAt(seenAt);
    };

    socket.on("seen_update", handleSeenUpdate);
    return () => {
      socket.off("seen_update", handleSeenUpdate);
    };
  }, [chatId, currentUid, recipientUid]);

  return recipientSeenAt;
}
