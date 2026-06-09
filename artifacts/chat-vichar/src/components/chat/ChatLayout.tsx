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
    markAsRead(user.uid, u.uid);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "hsl(228 28% 6%)" }}>
      {/* Sidebar */}
      <div className={[
        "flex-shrink-0 h-full",
        "w-full md:w-80 lg:w-96",
        selectedUser ? "hidden md:flex" : "flex",
        "flex-col",
      ].join(" ")}>
        <Sidebar
          currentUser={user}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Chat panel */}
      <main className={[
        "flex-1 flex flex-col h-full relative min-w-0",
        selectedUser ? "flex" : "hidden md:flex",
      ].join(" ")}
        style={{ borderLeft: "1px solid rgba(124,58,237,.1)" }}>
        {selectedUser ? (
          <ChatWindow currentUser={user} selectedUser={selectedUser} onBack={() => setSelectedUser(null)} />
        ) : (
          /* ── Premium welcome state ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            {/* Background gradient orbs */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%)" }} />

            <div className="relative">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,.2), rgba(79,70,229,.15))",
                  border: "1px solid rgba(124,58,237,.25)",
                  boxShadow: "0 0 40px rgba(124,58,237,.12)"
                }}>
                <MessageSquare className="w-11 h-11" style={{ color: "#a78bfa" }} />
              </div>
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20"
                style={{ background: "radial-gradient(circle, rgba(124,58,237,.8), transparent)" }} />
            </div>

            <h2 className="text-2xl font-bold gradient-text mb-2">
              Welcome to Chat-vichar
            </h2>
            <p className="text-muted-foreground/70 max-w-xs text-sm leading-relaxed">
              Select a conversation from the sidebar to start messaging securely.
            </p>

            {/* Decorative dots */}
            <div className="flex gap-2 mt-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    background: "rgba(167,139,250,.4)",
                    animationDelay: `${i * 300}ms`
                  }} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
