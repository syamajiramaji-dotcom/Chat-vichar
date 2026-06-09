import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { ChatUser } from "@/types/chat";
import { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: User;
  selectedUser: ChatUser | null;
  onSelectUser: (user: ChatUser) => void;
  unreadCounts: Record<string, number>;
}

export function Sidebar({ currentUser, selectedUser, onSelectUser, unreadCounts }: SidebarProps) {
  const { users, loading } = useUsers(currentUser.uid);
  const { logout } = useAuth();
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

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, n) => sum + n, 0),
    [unreadCounts]
  );

  const myInitial = (currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase();
  const myName = currentUser.displayName || currentUser.email?.split("@")[0] || "Me";

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full flex-shrink-0"
      style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid rgba(124,58,237,.15)" }}>

      {/* ── Gradient header ── */}
      <div className="gradient-sidebar-header shrink-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm gradient-text tracking-wide">Chat-vichar</span>
          </div>
          <Button
            variant="ghost" size="icon"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground hover:bg-white/[.06] h-8 w-8 rounded-xl"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Current user row */}
        <div className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.2)" }}>
          <div className="relative shrink-0">
            <Avatar className="h-11 w-11 ring-2 ring-violet-500/30">
              <AvatarImage src={currentUser.photoURL || undefined} />
              <AvatarFallback className="font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {myInitial}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0e0b2e] neon-online" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 8px rgba(124,58,237,.6)" }}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{myName}</p>
            <p className="text-xs text-green-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
              Online
            </p>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search contacts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-white/[.04] border-white/[.07] focus:border-primary/50 focus:bg-white/[.06] rounded-xl placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* ── Contact list ── */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-white/[.05] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 bg-white/[.05] animate-pulse rounded-lg" />
                  <div className="h-2.5 w-16 bg-white/[.04] animate-pulse rounded-lg" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-white/[.04] flex items-center justify-center"
                style={{ border: "1px solid rgba(124,58,237,.2)" }}>
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No contacts match your search." : "No other users found yet."}
              </p>
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
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 text-left relative",
                    isSelected
                      ? "text-white"
                      : "hover:bg-white/[.04]"
                  )}
                  style={isSelected ? {
                    background: "linear-gradient(135deg, rgba(124,58,237,.25), rgba(79,70,229,.15))",
                    border: "1px solid rgba(124,58,237,.3)",
                    boxShadow: "0 0 20px rgba(124,58,237,.12) inset"
                  } : undefined}
                >
                  {/* Left accent bar for selected */}
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 rounded-full"
                      style={{ background: "linear-gradient(180deg,#a78bfa,#818cf8)" }} />
                  )}

                  <div className="relative shrink-0">
                    <Avatar className={cn("h-12 w-12", isSelected && "ring-2 ring-violet-500/40")}>
                      <AvatarImage src={u.photoURL || undefined} alt={u.displayName} />
                      <AvatarFallback className={cn(
                        "font-semibold text-sm",
                        isSelected ? "text-white" : "text-muted-foreground bg-white/[.06]"
                      )}
                        style={isSelected ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" } : undefined}>
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    {u.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[hsl(228,26%,7%)] neon-online" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80",
                        isSelected && "text-white font-semibold"
                      )}>
                        {u.displayName || u.email || "Unknown"}
                      </span>
                      {unread > 0 && !isSelected && (
                        <span
                          data-testid={`badge-unread-${u.uid}`}
                          className="min-w-[20px] h-5 text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0 text-white"
                          style={{
                            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                            boxShadow: "0 0 10px rgba(124,58,237,.55)"
                          }}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs truncate block mt-0.5",
                      u.online ? "text-green-400" : "text-muted-foreground/70"
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
