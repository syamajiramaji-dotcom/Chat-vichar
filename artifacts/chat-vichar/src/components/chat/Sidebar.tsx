import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { ChatUser } from "@/types/chat";
import { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, LogOut, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: User;
  selectedUser: ChatUser | null;
  onSelectUser: (user: ChatUser) => void;
}

export function Sidebar({ currentUser, selectedUser, onSelectUser }: SidebarProps) {
  const { users, loading } = useUsers(currentUser.uid);
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const lowerQ = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        (u.displayName || "").toLowerCase().includes(lowerQ) ||
        (u.email || "").toLowerCase().includes(lowerQ)
    );
  }, [users, searchQuery]);

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-border bg-sidebar flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between sticky top-0 z-10 bg-sidebar">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-sidebar-border shadow-sm">
            <AvatarImage src={currentUser.photoURL || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {currentUser.displayName?.charAt(0).toUpperCase() ||
                currentUser.email?.charAt(0).toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-sidebar-foreground truncate max-w-[140px]">
              {currentUser.displayName || currentUser.email?.split("@")[0] || "Me"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Online
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8"
          title="Log out"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-sidebar-border h-9 text-sm"
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {loading ? (
            /* Skeleton loading state */
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-2.5 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No contacts match your search." : "No other users found yet."}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?.uid === u.uid;
              const initial = (u.displayName || u.email || "U").charAt(0).toUpperCase();

              return (
                <button
                  key={u.uid}
                  data-testid={`user-item-${u.uid}`}
                  onClick={() => onSelectUser(u)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 text-left",
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-sidebar-accent/60"
                  )}
                >
                  {/* Avatar + online dot */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border border-background shadow-sm">
                      <AvatarImage src={u.photoURL || undefined} alt={u.displayName} />
                      <AvatarFallback
                        className={cn(
                          "font-semibold text-sm",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    {u.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-sidebar rounded-full" />
                    )}
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "font-medium text-sm truncate",
                          isSelected ? "text-primary" : "text-sidebar-foreground"
                        )}
                      >
                        {u.displayName || u.email || "Unknown"}
                      </span>
                      {!u.online && u.lastSeen > 0 && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(u.lastSeen, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {u.online ? "Online" : "Offline"}
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
