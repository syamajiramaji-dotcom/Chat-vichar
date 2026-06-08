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

    const handleReactionUpdate = ({
      chatId: updatedChatId,
      messageId,
      reactions,
    }: {
      chatId: string;
      messageId: string;
      reactions: Record<string, string[]>;
    }) => {
      if (updatedChatId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("reaction_update", handleReactionUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("reaction_update", handleReactionUpdate);
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

      setMessages((prev) => [...prev, message]);
      socket.emit("send_message", { chatId, recipientUid, message });
    },
    [chatId, currentUid, recipientUid]
  );

  return { messages, sendMessage };
}
