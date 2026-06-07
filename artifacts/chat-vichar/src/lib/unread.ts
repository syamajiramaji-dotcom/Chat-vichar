import { ref, update, set, increment } from "firebase/database";
import { db } from "@/lib/firebase";

/** Atomically bump the unread counter for a recipient when a message is sent. */
export async function incrementUnread(recipientUid: string, senderUid: string) {
  await update(ref(db, `unread/${recipientUid}`), {
    [senderUid]: increment(1),
  });
}

/** Reset the unread count to 0 when the current user opens a conversation. */
export async function markAsRead(currentUid: string, otherUid: string) {
  await set(ref(db, `unread/${currentUid}/${otherUid}`), 0);
}
