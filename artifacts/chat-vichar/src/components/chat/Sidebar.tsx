import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { ChatUser } from "@/types/chat";
import { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Menu, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: User;
  selectedUser: ChatUser | null;
  onSelectUser: (user: ChatUser) => void;
  unreadCounts: Record<string, number>;
  onOpenNav: () => void;
}

export function Sidebar({ currentUser, selectedUser, onSelectUser, unreadCounts, onOpenNav }: SidebarProps) {
  const { users, loading, error } = useUsers(currentUser.uid);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aUnread = unreadCounts[a.uid] ?? 0;
      const bUnread = unreadCounts[b.uid] ?? 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      if (b.online !== a.online) return b.online ? 1 : -1;
      return (a.displayName || "").localeCompare(b.displayName || "");
    });
  }, [users, unreadCounts]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return sortedUsers;
    const lq = searchQuery.toLowerCase();
    return sortedUsers.filter(
      (u) =>
        (u.displayName || "").toLowerCase().includes(lq) ||
        (u.email || "").toLowerCase().includes(lq)
    );
  }, [sortedUsers, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full"
      style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid var(--t-sidebar-panel-border)" }}>

      {/* ── Header ── */}
      <div className="shrink-0 gradient-sidebar-header">
        <div className="flex items-center gap-3 px-4 h-16">
          {/* Mobile: hamburger to open NavSidebar */}
          <Button variant="ghost" size="icon"
            aria-label="Open navigation"
            className="md:hidden h-10 w-10 rounded-[14px] text-muted-foreground hover:text-foreground active:scale-95 shrink-0"
            onClick={onOpenNav}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--t-gradient-primary)" }}>
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-[15px] gradient-text tracking-wide leading-tight">Chats</h2>
              <p className="text-[11px] text-muted-foreground/65 mt-0.5">Your conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-3.5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--t-divider)" }}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search contacts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm rounded-[15px] placeholder:text-muted-foreground/50"
            style={{ background: "var(--t-search-bg)", border: "1px solid var(--t-search-border)" }}
          />
        </div>
      </div>

      {/* ── Contact list ── */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 bg-muted animate-pulse rounded-lg" />
                  <div className="h-2.5 w-16 bg-muted animate-pulse rounded-lg" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"
                style={{ border: "1px solid var(--t-user-chip-border)" }}>
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {error
                  ? "Contacts could not be loaded. Check the server connection and try again."
                  : searchQuery
                  ? "No contacts match your search."
                  : "No other users found yet."}
              </p>
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              )}
            </div>
          ) : (
            filteredUsers.map((u, idx) => {
              const isSelected = selectedUser?.uid === u.uid;
              const initial = (u.displayName || u.email || "U").charAt(0).toUpperCase();
              const unread = unreadCounts[u.uid] ?? 0;

              return (
                <button
                  key={u.uid || `user-${idx}`}
                  data-testid={`user-item-${u.uid}`}
                  onClick={() => onSelectUser(u)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-[18px] transition-all duration-150 text-left relative active:scale-[.99]",
                    !isSelected && "hover:bg-[var(--t-contact-hover-bg)]"
                  )}
                  style={isSelected ? {
                    background: "var(--t-contact-selected-bg)",
                    border: "1px solid var(--t-contact-selected-border)",
                    boxShadow: "0 0 20px var(--t-contact-selected-shadow) inset"
                  } : undefined}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 rounded-full"
                      style={{ background: "var(--t-contact-bar)" }} />
                  )}

                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.photoURL || undefined} alt={u.displayName} />
                      <AvatarFallback className={cn(
                        "font-semibold text-sm",
                        isSelected ? "text-white" : "text-muted-foreground bg-muted"
                      )}
                        style={isSelected ? { background: "var(--t-gradient-primary)" } : undefined}>
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    {u.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-transparent neon-online" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"
                      )}>
                        {u.displayName || u.email || "Unknown"}
                      </span>
                      {unread > 0 && !isSelected && (
                        <span
                          data-testid={`badge-unread-${u.uid}`}
                          className="min-w-[20px] h-5 text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0 text-white"
                          style={{
                            background: "var(--t-badge-bg)",
                            boxShadow: "0 0 10px var(--t-badge-shadow)"
                          }}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs truncate block mt-0.5",
                      u.online ? "text-green-500" : "text-muted-foreground/70"
                    )}>
                      {u.online
                        ? "● Online"
                        : u.lastSeen > 0
                        ? `Last seen ${formatDistanceToNow(u.lastSeen, { addSuffix: true })}`
                        : "Offline"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
