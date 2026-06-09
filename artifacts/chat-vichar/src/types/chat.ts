export interface ChatUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  online: boolean;
  lastSeen: number;
}

export type MessageMediaType = "image" | "video" | "audio";

export interface MessageMedia {
  url: string;
  publicId: string;
  mediaType: MessageMediaType;
  duration?: number;
}

export interface ReplyTo {
  messageId: string;
  text?: string;
  senderName: string;
  mediaType?: MessageMediaType;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  text?: string;
  media?: MessageMedia;
  replyTo?: ReplyTo;
  timestamp: number;
  reactions?: Record<string, string[]>; // emoji → [uid, uid, ...]
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  participants: Record<string, boolean>;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount?: number;
}
