import { useState, useMemo, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NavSidebar, type NavSection } from "@/components/nav/NavSidebar";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { ChatUser } from "@/types/chat";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { markAsRead } from "@/lib/unread";
import { Menu, MessageSquare } from "lucide-react";

const PagePanel = lazy(() =>
  import("@/components/nav/PagePanel").then((m) => ({ default: m.PagePanel }))
);

const CHAT_SECTIONS: NavSection[] = ["chats"];

export function ChatLayout() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<NavSection>("chats");
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const unreadCounts = useUnreadCounts(user?.uid ?? "");

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, n) => sum + n, 0),
    [unreadCounts]
  );

  if (!user) return null;

  const handleSelectUser = (u: ChatUser) => {
    setSelectedUser(u);
    markAsRead(user.uid, u.uid);
  };

  const handleSectionChange = (section: NavSection) => {
    setActiveSection(section);
    // When switching away from chats, deselect user so we show the panel content
    if (!CHAT_SECTIONS.includes(section)) setSelectedUser(null);
  };

  const isChats = activeSection === "chats";

  // Which panel to show (middle column on desktop, or on mobile when no chat is selected)
  const showContactsPanel = isChats;
  const showPagePanel = !isChats;

  // On mobile: if a chat is selected and we're in chats section, show full-screen ChatWindow
  const mobileShowChatWindow = isChats && selectedUser !== null;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">

      {/* ── Left Nav Sidebar ── */}
      <NavSidebar
        currentUser={user}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        totalUnread={totalUnread}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* ── Middle panel (contacts OR page content) ── */}
      {/*
        Desktop: always visible middle panel (320px)
        Mobile: shown when no chat is selected
      */}
      <div className={[
        "flex-shrink-0 h-full flex flex-col",
        "md:w-[300px] lg:w-[320px] w-full",
        // Mobile: hide when chat is open
        mobileShowChatWindow ? "hidden md:flex" : "flex",
      ].join(" ")}>
        {showContactsPanel && (
          <Sidebar
            currentUser={user}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            unreadCounts={unreadCounts}
            onOpenNav={() => setNavOpen(true)}
          />
        )}
        {showPagePanel && (
          <div className="flex-1 flex flex-col h-full overflow-hidden"
            style={{
              background: "hsl(var(--background))",
              borderRight: "1px solid var(--t-panel-border-left)"
            }}>
            {/* Mobile hamburger header for page panels */}
            <div className="md:hidden shrink-0 gradient-sidebar-header">
              <div className="flex items-center gap-3 px-4 h-16">
                <button
                  onClick={() => setNavOpen(true)}
                  aria-label="Open navigation"
                  className="h-10 w-10 rounded-[14px] flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                  style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)" }}>
                  <Menu className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground capitalize">{activeSection}</p>
                  <p className="text-[11px] text-muted-foreground">Chat-vichar</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <PagePanel section={activeSection} />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* ── Main chat / welcome area ── */}
      <main className={[
        "flex-1 flex flex-col h-full relative min-w-0",
        // Mobile: only show if a chat is selected (for chats section) or always for page content
        mobileShowChatWindow ? "flex" : "hidden md:flex",
      ].join(" ")}
        style={{ borderLeft: "1px solid var(--t-panel-border-left)" }}>

        {isChats && selectedUser ? (
          <ChatWindow
            currentUser={user}
            selectedUser={selectedUser}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          /* ── Welcome / select-a-chat placeholder (desktop only) ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{ background: "var(--t-welcome-orb)" }} />
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto"
                style={{
                  background: "var(--t-welcome-icon-bg)",
                  border: "1px solid var(--t-welcome-icon-border)",
                  boxShadow: "var(--t-welcome-icon-shadow)"
                }}>
                <MessageSquare className="w-11 h-11" style={{ color: "var(--t-icon-color)" }} />
              </div>
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20"
                style={{ background: "var(--t-welcome-orb)" }} />
            </div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Welcome to Chat-vichar</h2>
            <p className="text-muted-foreground/70 max-w-xs text-sm leading-relaxed">
              {isChats
                ? "Select a conversation from the sidebar to start messaging."
                : "Select a chat from the Chats section to start messaging."}
            </p>
            <div className="flex gap-2 mt-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--t-icon-color)", opacity: 0.4, animationDelay: `${i * 300}ms` }} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
