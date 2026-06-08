import { useEffect, useState, useCallback } from "react";
import { socket } from "@/lib/socket";
import { Message, ReplyTo, MessageMedia } from "@/types/chat";

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
    if (!chatId) {
      setMessages([]);
      return;
    }

    // Fetch message history via acknowledgement callback
    socket.emit(
      "get_messages",
      { chatId },
      (response: { messages: Message[] }) => {
        const sorted = (response?.messages ?? []).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setMessages(sorted);
      }
    );

    // Listen for incoming messages in this chat
    const handleNewMessage = ({
      chatId: incomingChatId,
      message,
    }: {
      chatId: string;
      message: Message;
    }) => {
      if (incomingChatId !== chatId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
      });
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
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

      const message: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        senderId: currentUid,
        senderName,
        senderPhotoURL,
        timestamp: Date.now(),
        ...(text ? { text } : {}),
        ...(media ? { media } : {}),
        ...(replyTo ? { replyTo } : {}),
      };

      // Optimistic local update — appears instantly for the sender
      setMessages((prev) => [...prev, message]);

      // Tell the server — it persists and delivers to recipient
      socket.emit("send_message", { chatId, recipientUid, message });
    },
    [chatId, currentUid, recipientUid]
  );

  return { messages, sendMessage };
}
