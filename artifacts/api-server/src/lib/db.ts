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
  timestamp: number;
}

const MAX_MESSAGES = 200;

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

export async function setUser(uid: string, info: StoredUser): Promise<void> {
  await client.set(`user:${uid}`, info);
}

export async function getUser(uid: string): Promise<StoredUser | null> {
  return (await client.get(`user:${uid}`)) as StoredUser | null;
}

export async function getAllUsers(): Promise<Record<string, StoredUser>> {
  const keys = (await client.list("user:")) as string[];
  const users: Record<string, StoredUser> = {};
  await Promise.all(
    keys.map(async (key) => {
      const uid = key.replace("user:", "");
      const info = (await client.get(key)) as StoredUser | null;
      if (info) users[uid] = info;
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
  const keys = (await client.list(`unread:${uid}:`)) as string[];
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
