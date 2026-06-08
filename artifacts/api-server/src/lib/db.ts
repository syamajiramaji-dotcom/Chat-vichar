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
 * @replit/database v3.x list() returns { ok: boolean, value: string[] }
 * rather than a plain string[]. Handle all known shapes defensively.
 */
function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    // v3 shape: { ok: true, value: ["key1", ...] }
    if (Array.isArray(obj.value)) return obj.value as string[];
    // fallback: treat object keys as the list (legacy behaviour)
    return Object.keys(obj);
  }
  return [];
}

export async function addMessage(chatId: string, message: StoredMessage): Promise<void> {
  const key = `chat:${chatId}:messages`;
  const existing = (await client.get(key)) as StoredMessage[] | null;
  const messages = Array.isArray(existing) ? existing : [];
  messages.push(message);
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
  await client.set(key, messages);
}

export async function getMessages(chatId: string): Promise<StoredMessage[]> {
  const key = `chat:${chatId}:messages`;
  const messages = (await client.get(key)) as StoredMessage[] | null;
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

export async function setUser(uid: string, info: StoredUser): Promise<void> {
  await client.set(`user:${uid}`, info);
}

export async function getUser(uid: string): Promise<StoredUser | null> {
  return (await client.get(`user:${uid}`)) as StoredUser | null;
}

export async function getAllUsers(): Promise<Record<string, StoredUser>> {
  const keys = toStringArray(await client.list("user:"));
  const users: Record<string, StoredUser> = {};
  await Promise.all(
    keys.map(async (key) => {
      const uid = key.replace("user:", "");
      const info = (await client.get(key)) as StoredUser | null;
      if (info) users[uid] = { ...info, uid }; // backfill uid in case old entry is missing it
    })
  );
  return users;
}

export async function incrementUnread(recipientUid: string, senderUid: string): Promise<number> {
  const key = `unread:${recipientUid}:${senderUid}`;
  const current = (await client.get(key)) as number | null;
  const newCount = (current ?? 0) + 1;
  await client.set(key, newCount);
  return newCount;
}

export async function resetUnread(recipientUid: string, senderUid: string): Promise<void> {
  await client.set(`unread:${recipientUid}:${senderUid}`, 0);
}

export async function getUnreadCounts(uid: string): Promise<Record<string, number>> {
  const keys = toStringArray(await client.list(`unread:${uid}:`));
  const counts: Record<string, number> = {};
  await Promise.all(
    keys.map(async (key) => {
      const senderUid = key.replace(`unread:${uid}:`, "");
      const count = (await client.get(key)) as number | null;
      if (count && count > 0) counts[senderUid] = count;
    })
  );
  return counts;
}

export async function setSeen(chatId: string, uid: string, timestamp: number): Promise<void> {
  await client.set(`seen:${chatId}:${uid}`, timestamp);
}

export async function getSeen(chatId: string, uid: string): Promise<number> {
  const val = (await client.get(`seen:${chatId}:${uid}`)) as number | null;
  return val ?? 0;
}
