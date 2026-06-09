import { useEffect, useState, useCallback } from "react";
import { socket } from "@/lib/socket";
import { Message, ReplyTo, MessageMedia } from "@/types/chat";

export function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

const DELETED_FOR_ME_KEY = (uid: string, chatId: string) =>
  `deletedForMe:${uid}:${chatId}`;

function loadDeletedForMe(uid: string, chatId: string): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_FOR_ME_KEY(uid, chatId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveDeletedForMe(uid: string, chatId: string, ids: Set<string>) {
  try {
    localStorage.setItem(DELETED_FOR_ME_KEY(uid, chatId), JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function useMessages(
  chatId: string | null,
  currentUid: string,
  recipientUid: string
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [deletedForMe, setDeletedForMe] = useState<Set<string>>(new Set());

  // Load persisted "delete for me" list whenever chatId/user changes
  useEffect(() => {
    if (!chatId) {
      setDeletedForMe(new Set());
      return;
    }
    setDeletedForMe(loadDeletedForMe(currentUid, chatId));
  }, [chatId, currentUid]);

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

    const handleMessageDeleted = ({
      chatId: deletedChatId,
      messageId,
      deleteForEveryone,
    }: {
      chatId: string;
      messageId: string;
      deleteForEveryone: boolean;
    }) => {
      if (deletedChatId !== chatId) return;

      if (deleteForEveryone) {
        // Mark as deleted in state so both sides see the stub
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deleted: true, text: undefined, media: undefined, reactions: undefined, replyTo: undefined }
              : m
          )
        );
      } else {
        // Delete for me — add to local set and persist
        setDeletedForMe((prev) => {
          const next = new Set(prev);
          next.add(messageId);
          saveDeletedForMe(currentUid, chatId, next);
          return next;
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("reaction_update", handleReactionUpdate);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("reaction_update", handleReactionUpdate);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [chatId, currentUid]);

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

  const deleteMessage = useCallback(
    (messageId: string, deleteForEveryone: boolean) => {
      if (!chatId) return;
      socket.emit("delete_message", {
        chatId,
        messageId,
        recipientUid,
        deleteForEveryone,
      });
    },
    [chatId, recipientUid]
  );

  // Filter out "deleted for me" messages before returning
  const visibleMessages = messages.filter((m) => !deletedForMe.has(m.id));

  return { messages: visibleMessages, sendMessage, deleteMessage };
}
