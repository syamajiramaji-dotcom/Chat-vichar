import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import webpush from "web-push";
import { logger } from "../lib/logger";
import * as db from "../lib/db";

// ── VAPID configuration ───────────────────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:chatvichar@admin.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendPushToUser(recipientUid: string, payload: object) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  try {
    const sub = await db.getPushSubscription(recipientUid);
    if (!sub) return;
    await webpush.sendNotification(
      sub as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    // 410 Gone means subscription expired — remove it
    if ((err as { statusCode?: number }).statusCode === 410) {
      await db.deletePushSubscription(recipientUid);
    }
  }
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // ── authenticate ────────────────────────────────────────────────────────
    socket.on(
      "authenticate",
      async (info: {
        uid: string;
        displayName: string;
        email: string;
        photoURL: string | null;
      }) => {
        const { uid } = info;
        socket.data.uid = uid;

        await socket.join(`user:${uid}`);
        await db.setUser(uid, { ...info, online: true, lastSeen: Date.now() });

        const counts = await db.getUnreadCounts(uid);
        socket.emit("unread_counts", { counts });

        const users = await db.getAllUsers();
        // Send the snapshot directly to the newly authenticated socket as
        // well as broadcasting it. This avoids a race where a new client
        // misses the broadcast while React is mounting its listeners.
        socket.emit("users_update", { users });
        socket.broadcast.emit("users_update", { users });

        logger.info({ uid }, "User authenticated");
      }
    );

    // ── get_users ────────────────────────────────────────────────────────────
    socket.on(
      "get_users",
      async (
        _payload: unknown,
        callback: (r: { users: Record<string, db.StoredUser> }) => void
      ) => {
        try {
          const users = await db.getAllUsers();
          if (typeof callback === "function") callback({ users });
        } catch (error) {
          logger.error({ error }, "Failed to load users");
          if (typeof callback === "function") callback({ users: {} });
        }
      }
    );

    // ── get_messages ─────────────────────────────────────────────────────────
    socket.on(
      "get_messages",
      async (
        { chatId }: { chatId: string },
        callback: (r: { messages: db.StoredMessage[] }) => void
      ) => {
        const messages = await db.getMessages(chatId);
        if (typeof callback === "function") callback({ messages });
      }
    );

    // ── send_message ─────────────────────────────────────────────────────────
    socket.on(
      "send_message",
      async ({
        chatId,
        recipientUid,
        message,
      }: {
        chatId: string;
        recipientUid: string;
        message: db.StoredMessage;
      }) => {
        const senderUid = socket.data.uid as string | undefined;
        if (!senderUid) return;

        await db.addMessage(chatId, message);

        io.to(`user:${recipientUid}`).emit("new_message", { chatId, message });
        socket.to(`user:${senderUid}`).emit("new_message", { chatId, message });

        const newCount = await db.incrementUnread(recipientUid, senderUid);
        io.to(`user:${recipientUid}`).emit("unread_update", {
          senderUid,
          count: newCount,
        });

        // Send a push notification if the recipient has no active sockets
        const recipientRoom = io.sockets.adapter.rooms.get(`user:${recipientUid}`);
        const recipientOnline = recipientRoom && recipientRoom.size > 0;
        if (!recipientOnline) {
          const sender = await db.getUser(senderUid);
          const senderName = sender?.displayName || message.senderName || "Someone";
          const body = message.text
            ? message.text.slice(0, 80) + (message.text.length > 80 ? "…" : "")
            : message.media
            ? "📎 Sent an attachment"
            : "New message";
          await sendPushToUser(recipientUid, {
            title: senderName,
            body,
            tag: `chat-${chatId}`,
            url: "/",
          });
        }
      }
    );

    // ── delete_message ────────────────────────────────────────────────────────
    socket.on(
      "delete_message",
      async ({
        chatId,
        messageId,
        recipientUid,
        deleteForEveryone,
      }: {
        chatId: string;
        messageId: string;
        recipientUid: string;
        deleteForEveryone: boolean;
      }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid) return;

        if (deleteForEveryone) {
          const ok = await db.deleteMessage(chatId, messageId);
          if (!ok) return;
          const payload = { chatId, messageId, deleteForEveryone: true };
          io.to(`user:${uid}`).emit("message_deleted", payload);
          io.to(`user:${recipientUid}`).emit("message_deleted", payload);
        } else {
          // Delete for me — server does nothing; client handles it locally
          socket.emit("message_deleted", { chatId, messageId, deleteForEveryone: false });
        }
      }
    );

    // ── mark_read ────────────────────────────────────────────────────────────
    socket.on("mark_read", async ({ senderUid }: { senderUid: string }) => {
      const uid = socket.data.uid as string | undefined;
      if (!uid) return;
      await db.resetUnread(uid, senderUid);
      socket.emit("unread_update", { senderUid, count: 0 });
    });

    // ── mark_seen ────────────────────────────────────────────────────────────
    socket.on(
      "mark_seen",
      async ({ chatId, senderUid }: { chatId: string; senderUid: string }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid) return;
        const seenAt = Date.now();
        await db.setSeen(chatId, uid, seenAt);
        io.to(`user:${senderUid}`).emit("seen_update", { chatId, uid, seenAt });
      }
    );

    // ── react_message ────────────────────────────────────────────────────────
    socket.on(
      "react_message",
      async ({
        chatId,
        messageId,
        emoji,
        recipientUid,
      }: {
        chatId: string;
        messageId: string;
        emoji: string;
        recipientUid: string;
      }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid) return;
        const reactions = await db.toggleReaction(chatId, messageId, emoji, uid);
        const payload = { chatId, messageId, reactions };
        io.to(`user:${uid}`).emit("reaction_update", payload);
        io.to(`user:${recipientUid}`).emit("reaction_update", payload);
      }
    );

    // ── push_subscribe ────────────────────────────────────────────────────────
    socket.on(
      "push_subscribe",
      async ({ subscription }: { subscription: object }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid || !subscription) return;
        await db.savePushSubscription(uid, subscription);
      }
    );

    // ── typing ───────────────────────────────────────────────────────────────
    socket.on(
      "typing_start",
      ({ chatId, recipientUid }: { chatId: string; recipientUid: string }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid) return;
        io.to(`user:${recipientUid}`).emit("typing", { chatId, uid, isTyping: true });
      }
    );

    socket.on(
      "typing_stop",
      ({ chatId, recipientUid }: { chatId: string; recipientUid: string }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid) return;
        io.to(`user:${recipientUid}`).emit("typing", { chatId, uid, isTyping: false });
      }
    );

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      const uid = socket.data.uid as string | undefined;
      if (!uid) return;
      const existing = await db.getUser(uid);
      if (existing) {
        await db.setUser(uid, { ...existing, online: false, lastSeen: Date.now() });
      }
      const users = await db.getAllUsers();
      io.emit("users_update", { users });
      logger.info({ uid }, "User disconnected");
    });
  });

  return io;
}
