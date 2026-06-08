import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { logger } from "../lib/logger";
import * as db from "../lib/db";

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // ── authenticate ────────────────────────────────────────────────────────
    // Client sends this immediately after Firebase auth resolves
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

        // Join a personal room so we can deliver messages to this user
        await socket.join(`user:${uid}`);

        // Persist / update user info
        await db.setUser(uid, { ...info, online: true, lastSeen: Date.now() });

        // Send this user their current unread counts
        const counts = await db.getUnreadCounts(uid);
        socket.emit("unread_counts", { counts });

        // Broadcast updated roster to every connected client
        const users = await db.getAllUsers();
        io.emit("users_update", { users });

        logger.info({ uid }, "User authenticated");
      }
    );

    // ── get_users ────────────────────────────────────────────────────────────
    socket.on("get_users", async (_: unknown, callback: (r: { users: Record<string, db.StoredUser> }) => void) => {
      const users = await db.getAllUsers();
      if (typeof callback === "function") callback({ users });
    });

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

        // Deliver to recipient
        io.to(`user:${recipientUid}`).emit("new_message", { chatId, message });

        // Deliver to sender's other sessions (not this socket)
        socket.to(`user:${senderUid}`).emit("new_message", { chatId, message });

        // Increment and forward unread counter for recipient
        const newCount = await db.incrementUnread(recipientUid, senderUid);
        io.to(`user:${recipientUid}`).emit("unread_update", {
          senderUid,
          count: newCount,
        });
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
    // recipient emits this when they open the chat; senderUid = the other person
    socket.on(
      "mark_seen",
      async ({ chatId, senderUid }: { chatId: string; senderUid: string }) => {
        const uid = socket.data.uid as string | undefined;
        if (!uid) return;
        const seenAt = Date.now();
        await db.setSeen(chatId, uid, seenAt);
        // Notify the sender that messages were seen
        io.to(`user:${senderUid}`).emit("seen_update", { chatId, uid, seenAt });
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
