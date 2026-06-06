import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { ChatUser } from "@/types/chat";

export function ChatLayout() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar 
        currentUser={user} 
        selectedUser={selectedUser} 
        onSelectUser={setSelectedUser} 
      />
      
      {/* Right Chat Panel */}
      <main className="flex-1 flex flex-col h-full bg-card/30 relative">
        {selectedUser ? (
          <ChatWindow 
            currentUser={user} 
            selectedUser={selectedUser} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-full" />
              </div>
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-2">Welcome to Chat-vichar</h2>
            <p className="text-muted-foreground max-w-md">
              Select a conversation from the sidebar to start messaging, or search for someone new.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
