import { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import { ChatUser, Message } from "@/types/chat";
import { getChatId, useMessages } from "@/hooks/useMessages";
import { useChatSeen } from "@/hooks/useChatSeen";
import { MessageBubble, MessageStatus } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatWindowProps {
  currentUser: User;
  selectedUser: ChatUser;
  onBack: () => void;
}

function getMessageStatus(
  message: Message,
  currentUid: string,
  recipientOnline: boolean,
  recipientSeenAt: number
): MessageStatus {
  // Only compute status for messages sent by the current user
  if (message.senderId !== currentUid) return "sent";
  if (recipientSeenAt > 0 && message.timestamp <= recipientSeenAt) return "seen";
  if (recipientOnline) return "delivered";
  return "sent";
}

export function ChatWindow({ currentUser, selectedUser, onBack }: ChatWindowProps) {
  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  const { messages, sendMessage } = useMessages(chatId, currentUser.uid, selectedUser.uid);
  const recipientSeenAt = useChatSeen(chatId, currentUser.uid, selectedUser.uid);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (args: any) => {
    await sendMessage({
      ...args,
      senderName: currentUser.displayName || "User",
      senderPhotoURL: currentUser.photoURL,
    });
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center px-4 shrink-0 z-10 sticky top-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden mr-2 h-8 w-8 text-muted-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser.photoURL || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {(selectedUser.displayName || selectedUser.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {selectedUser.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {selectedUser.displayName || selectedUser.email || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {selectedUser.online
                ? "Online"
                : selectedUser.lastSeen
                ? `Last seen ${formatDistanceToNow(selectedUser.lastSeen, { addSuffix: true })}`
                : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 m-auto py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                <Avatar className="h-12 w-12 opacity-50 grayscale">
                  <AvatarImage src={selectedUser.photoURL || undefined} />
                  <AvatarFallback>
                    {(selectedUser.displayName || selectedUser.email || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p>This is the beginning of your chat with {selectedUser.displayName || "this user"}.</p>
              <p className="text-sm">Say hello!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.uid;
                const status = getMessageStatus(
                  msg,
                  currentUser.uid,
                  selectedUser.online,
                  recipientSeenAt
                );
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isCurrentUser={isCurrentUser}
                    status={status}
                    onReply={setReplyTo}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 w-full max-w-4xl mx-auto">
        <MessageInput
          onSendMessage={handleSendMessage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
