import { useEffect, useState, useCallback } from "react";
import { ref, push, onValue, query, limitToLast, update, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { Message, ReplyTo, MessageMedia } from "@/types/chat";
import { incrementUnread } from "@/lib/unread";

export function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

export function useMessages(
  chatId: string | null,
  currentUid: string,
  recipientUid: string
) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!chatId) return;
    const msgsRef = query(ref(db, `chats/${chatId}/messages`), limitToLast(100));
    const unsub = onValue(msgsRef, (snap) => {
      if (!snap.exists()) {
        setMessages([]);
        return;
      }
      const data = snap.val() as Record<string, Omit<Message, "id">>;
      const list: Message[] = Object.entries(data).map(([id, msg]) => ({
        id,
        ...msg,
      }));
      list.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(list);
    });
    return unsub;
  }, [chatId]);

  const sendMessage = useCallback(
    async ({
      text,
      media,
      replyTo,
      senderName,
      senderPhotoURL,
    }: {
      text?: string;
      media?: MessageMedia;
      replyTo?: ReplyTo;
      senderName: string;
      senderPhotoURL: string | null;
    }) => {
      if (!chatId) return;

      const msgsRef = ref(db, `chats/${chatId}/messages`);
      const newMsg: Omit<Message, "id"> = {
        senderId: currentUid,
        senderName,
        senderPhotoURL,
        timestamp: Date.now(),
        ...(text ? { text } : {}),
        ...(media ? { media } : {}),
        ...(replyTo ? { replyTo } : {}),
      };
      await push(msgsRef, newMsg);

      // Update chat metadata — use update() so the messages/seen sub-nodes are NOT overwritten
      await update(ref(db, `chats/${chatId}`), {
        lastMessage: text || `[${media?.mediaType}]`,
        lastMessageAt: serverTimestamp(),
      });

      // Bump the recipient's unread counter for this sender
      if (recipientUid) {
        await incrementUnread(recipientUid, currentUid);
      }
    },
    [chatId, currentUid, recipientUid]
  );

  return { messages, sendMessage };
}
