import Database from "@replit/database";

const client = new Database();

export interface StoredUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  online: boolean;
  lastSeen: number;
}

export interface StoredMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  text?: string;
  media?: object;
  replyTo?: object;
  reactions?: Record<string, string[]>;
  timestamp: number;
}

const MAX_MESSAGES = 200;

/**
 * @replit/database v3.x returns { ok: boolean, value: T } from both
 * list() and get(). Some legacy entries were stored while the code was
 * broken, resulting in double-wrapped data. Recursively peel until we
 * reach real data.
 */
function unwrap<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if ("ok" in obj && "value" in obj) return unwrap<T>(obj.value);
  }
  return raw as T;
}

/** Safely get a key's value, unwrapping the v3 response envelope */
async function dbGet<T>(key: string): Promise<T | null> {
  const raw = await client.get(key);
  return unwrap<T>(raw);
}

/** Safely coerce list() result into a string array */
async function dbList(prefix: string): Promise<string[]> {
  const raw = await client.list(prefix);
  const val = unwrap<string[]>(raw);
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return Object.keys(val as object);
  return [];
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function addMessage(chatId: string, message: StoredMessage): Promise<void> {
  const key = `chat:${chatId}:messages`;
  const existing = await dbGet<StoredMessage[]>(key);
  const messages = Array.isArray(existing) ? existing : [];
  messages.push(message);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  await client.set(key, messages);
}

export async function getMessages(chatId: string): Promise<StoredMessage[]> {
  const messages = await dbGet<StoredMessage[]>(`chat:${chatId}:messages`);
  return Array.isArray(messages) ? messages : [];
}

export async function toggleReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  uid: string
): Promise<Record<string, string[]>> {
  const key = `chat:${chatId}:messages`;
  const messages = await getMessages(chatId);
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) return {};

  const reactions: Record<string, string[]> = { ...(msg.reactions ?? {}) };
  const uids = [...(reactions[emoji] ?? [])];
  const idx = uids.indexOf(uid);
  if (idx >= 0) {
    uids.splice(idx, 1);
    if (uids.length === 0) delete reactions[emoji];
    else reactions[emoji] = uids;
  } else {
    reactions[emoji] = [...uids, uid];
  }

  msg.reactions = reactions;
  await client.set(key, messages);
  return reactions;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function setUser(uid: string, info: StoredUser): Promise<void> {
  await client.set(`user:${uid}`, info);
}

export async function getUser(uid: string): Promise<StoredUser | null> {
  return dbGet<StoredUser>(`user:${uid}`);
}

export async function getAllUsers(): Promise<Record<string, StoredUser>> {
  const keys = await dbList("user:");
  const users: Record<string, StoredUser> = {};
  await Promise.all(
    keys.map(async (key) => {
      const uid = key.replace("user:", "");
      const info = await dbGet<StoredUser>(key);
      if (info && uid) users[uid] = { ...info, uid };
    })
  );
  return users;
}

// ── Unread counts ─────────────────────────────────────────────────────────────

export async function incrementUnread(recipientUid: string, senderUid: string): Promise<number> {
  const key = `unread:${recipientUid}:${senderUid}`;
  const current = await dbGet<number>(key);
  const newCount = (typeof current === "number" ? current : 0) + 1;
  await client.set(key, newCount);
  return newCount;
}

export async function resetUnread(recipientUid: string, senderUid: string): Promise<void> {
  await client.set(`unread:${recipientUid}:${senderUid}`, 0);
}

export async function getUnreadCounts(uid: string): Promise<Record<string, number>> {
  const keys = await dbList(`unread:${uid}:`);
  const counts: Record<string, number> = {};
  await Promise.all(
    keys.map(async (key) => {
      const senderUid = key.replace(`unread:${uid}:`, "");
      const count = await dbGet<number>(key);
      if (typeof count === "number" && count > 0) counts[senderUid] = count;
    })
  );
  return counts;
}

// ── Seen timestamps ───────────────────────────────────────────────────────────

export async function setSeen(chatId: string, uid: string, timestamp: number): Promise<void> {
  await client.set(`seen:${chatId}:${uid}`, timestamp);
}

export async function getSeen(chatId: string, uid: string): Promise<number> {
  const val = await dbGet<number>(`seen:${chatId}:${uid}`);
  return typeof val === "number" ? val : 0;
}
