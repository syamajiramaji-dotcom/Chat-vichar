import { socket } from "./socket";

/**
 * Tell the server to reset the unread counter for messages received from `senderUid`.
 * Called when the current user opens a conversation.
 */
export function markAsRead(_currentUid: string, senderUid: string) {
  socket.emit("mark_read", { senderUid });
}
