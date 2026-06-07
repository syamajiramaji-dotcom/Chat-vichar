import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { ChatUser } from "@/types/chat";
import { MessageSquare } from "lucide-react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { markAsRead } from "@/lib/unread";

export function ChatLayout() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const unreadCounts = useUnreadCounts(user?.uid ?? "");

  if (!user) return null;

  const handleSelectUser = (u: ChatUser) => {
    setSelectedUser(u);
    // Clear unread counter as soon as the conversation is opened
    markAsRead(user.uid, u.uid);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar: always visible on md+; hidden on mobile when a chat is open */}
      <div
        className={[
          "flex-shrink-0 h-full",
          "w-full md:w-80 lg:w-96",
          selectedUser ? "hidden md:flex" : "flex",
          "flex-col",
        ].join(" ")}
      >
        <Sidebar
          currentUser={user}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Chat panel: always visible on md+; shown on mobile when a chat is open */}
      <main
        className={[
          "flex-1 flex flex-col h-full bg-card/30 relative min-w-0",
          selectedUser ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {selectedUser ? (
          <ChatWindow
            currentUser={user}
            selectedUser={selectedUser}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary/50" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-2">
              Welcome to Chat-vichar
            </h2>
            <p className="text-muted-foreground max-w-md">
              Select a conversation from the sidebar to start messaging.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
