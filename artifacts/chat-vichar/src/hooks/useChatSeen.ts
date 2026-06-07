import { useEffect, useState } from "react";
import { ref, update, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * - Writes `chats/{chatId}/seen/{currentUid}` = Date.now() when the chat is opened.
 *   Uses update() on the seen sub-node so no sibling data is ever touched.
 * - Returns the timestamp (ms) of when the *recipient* last opened this chat.
 *   Used to decide whether a sent message has been "seen".
 */
export function useChatSeen(
  chatId: string | null,
  currentUid: string,
  recipientUid: string
): number {
  const [recipientSeenAt, setRecipientSeenAt] = useState(0);

  // Mark this chat as seen by the current user whenever they have it open.
  // update() on the seen sub-node — never overwrites messages.
  useEffect(() => {
    if (!chatId || !currentUid) return;
    update(ref(db, `chats/${chatId}/seen`), {
      [currentUid]: Date.now(),
    });
  }, [chatId, currentUid]);

  // Listen to when the recipient last saw this chat
  useEffect(() => {
    if (!chatId || !recipientUid) return;
    const seenRef = ref(db, `chats/${chatId}/seen/${recipientUid}`);
    const unsub = onValue(seenRef, (snap) => {
      setRecipientSeenAt(snap.exists() ? (snap.val() as number) : 0);
    });
    return unsub;
  }, [chatId, recipientUid]);

  return recipientSeenAt;
}
