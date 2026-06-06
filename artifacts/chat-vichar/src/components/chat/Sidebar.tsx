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
}

export function Sidebar({ currentUser, selectedUser, onSelectUser }: SidebarProps) {
  const users = useUsers(currentUser.uid);
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const lowerQ = searchQuery.toLowerCase();
    return users.filter(
      u =>
        (u.displayName || "").toLowerCase().includes(lowerQ) ||
        (u.email || "").toLowerCase().includes(lowerQ)
    );
  }, [users, searchQuery]);

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-border bg-sidebar flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-sidebar-border shadow-sm">
            <AvatarImage src={currentUser.photoURL || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-sidebar-foreground truncate max-w-[120px]">
              {currentUser.displayName}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8" title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-sidebar-border h-9"
          />
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No contacts found.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?.uid === u.uid;
              return (
                <button
                  key={u.uid}
                  onClick={() => onSelectUser(u)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left relative",
                    isSelected 
                      ? "bg-sidebar-accent shadow-sm" 
                      : "hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border border-background shadow-sm transition-transform duration-200 group-hover:scale-105">
                      <AvatarImage src={u.photoURL || undefined} />
                      <AvatarFallback className={cn(
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {(u.displayName || u.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {u.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-sidebar rounded-full z-10" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-sm text-sidebar-foreground truncate">
                        {u.displayName}
                      </span>
                      {!u.online && u.lastSeen && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(u.lastSeen, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
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
