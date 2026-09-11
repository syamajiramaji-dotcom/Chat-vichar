import { useState } from "react";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, MessageSquare, Users, UsersRound, Bookmark, Settings,
  Sun, Moon, LogOut, Info, Shield, FileText, BookOpen,
  HelpCircle, Mail, ChevronDown, X,
} from "lucide-react";

export type NavSection =
  | "home" | "chats" | "people" | "groups" | "saved" | "settings"
  | "about" | "privacy" | "terms" | "community" | "faq" | "contact";

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSidebarProps {
  currentUser: User;
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  totalUnread: number;
  isOpen: boolean;
  onClose: () => void;
}

const mainNav: NavItem[] = [
  { id: "home",    label: "Home",            icon: Home },
  { id: "chats",   label: "Chats",           icon: MessageSquare },
  { id: "people",  label: "People",          icon: Users },
  { id: "groups",  label: "Groups",          icon: UsersRound },
  { id: "saved",   label: "Saved Messages",  icon: Bookmark },
  { id: "settings",label: "Settings",        icon: Settings },
];

const pagesNav: NavItem[] = [
  { id: "about",     label: "About Us",              icon: Info },
  { id: "privacy",   label: "Privacy Policy",         icon: Shield },
  { id: "terms",     label: "Terms & Conditions",     icon: FileText },
  { id: "community", label: "Community Guidelines",   icon: BookOpen },
  { id: "faq",       label: "FAQ",                   icon: HelpCircle },
  { id: "contact",   label: "Contact Us",             icon: Mail },
];

export function NavSidebar({
  currentUser, activeSection, onSectionChange, totalUnread, isOpen, onClose,
}: NavSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [pagesOpen, setPagesOpen] = useState(false);

  const myInitial = (currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase();
  const myName = currentUser.displayName || currentUser.email?.split("@")[0] || "Me";

  const handleSelect = (section: NavSection) => {
    onSectionChange(section);
    onClose();
  };

  const SidebarContent = (
    <div className="flex flex-col h-full min-h-0"
      style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid var(--t-sidebar-panel-border)" }}>

      {/* ── Brand header ── */}
      <div className="shrink-0 gradient-sidebar-header">
        <div className="flex items-center justify-between px-4 py-4 sm:py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 btn-glow"
              style={{ background: "var(--t-gradient-primary)" }}>
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm gradient-text tracking-wide block leading-none">Chat-vichar</span>
              <span className="text-[10px] text-muted-foreground/60 leading-none">Secure messaging</span>
            </div>
          </div>
          {/* Mobile close */}
          <Button variant="ghost" size="icon"
            aria-label="Close navigation"
            className="md:hidden h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground active:scale-95"
            onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User card */}
        <div className="mx-3 mb-4 flex items-center gap-3 px-3.5 py-3 rounded-[20px]"
          style={{ background: "var(--t-user-chip-bg)", border: "1px solid var(--t-user-chip-border)" }}>
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.photoURL || undefined} />
              <AvatarFallback className="text-sm font-bold text-white"
                style={{ background: "var(--t-gradient-primary)" }}>
                {myInitial}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-transparent neon-online" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{myName}</p>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-3 space-y-1">

          {/* Main nav items */}
          {mainNav.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            const showBadge = id === "chats" && totalUnread > 0;
            return (
              <button key={id} onClick={() => handleSelect(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-[14px] text-sm font-medium transition-all duration-150 relative group active:scale-[.99]",
                  isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
                style={isActive ? {
                  background: "var(--t-gradient-primary)",
                  boxShadow: "0 4px 16px var(--t-sent-shadow)"
                } : undefined}
              >
                {!isActive && (
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "var(--t-contact-hover-bg)" }} />
                )}
                <Icon className={cn("w-[18px] h-[18px] shrink-0 relative z-10",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="relative z-10 flex-1 text-left">{label}</span>
                {showBadge && (
                  <span className="relative z-10 min-w-[20px] h-5 text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0"
                    style={isActive ? {
                      background: "rgba(255,255,255,.25)", color: "white"
                    } : {
                      background: "var(--t-badge-bg)",
                      boxShadow: "0 0 8px var(--t-badge-shadow)",
                      color: "white"
                    }}>
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div className="mx-1 my-3 border-t" style={{ borderColor: "var(--t-divider)" }} />

          {/* Pages section */}
          <button
            onClick={() => setPagesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[14px] group"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
              Pages
            </span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200",
              pagesOpen && "rotate-180"
            )} />
          </button>

          <AnimatePresence initial={false}>
            {pagesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pb-1">
                  {pagesNav.map(({ id, label, icon: Icon }) => {
                    const isActive = activeSection === id;
                    return (
                      <button key={id} onClick={() => handleSelect(id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-sm transition-all duration-150 relative group active:scale-[.99]",
                          isActive ? "text-white font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                        style={isActive ? {
                          background: "var(--t-gradient-primary)",
                          boxShadow: "0 4px 16px var(--t-sent-shadow)"
                        } : undefined}
                      >
                        {!isActive && (
                          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "var(--t-contact-hover-bg)" }} />
                        )}
                        <Icon className={cn("w-4 h-4 shrink-0 relative z-10",
                          isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-foreground"
                        )} />
                        <span className="relative z-10 text-left">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* ── Bottom actions ── */}
      <div className="shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 space-y-1"
        style={{ borderTop: "1px solid var(--t-divider)" }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme}
           className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[14px] text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-150 relative group active:scale-[.99]">
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "var(--t-contact-hover-bg)" }} />
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px] shrink-0 relative z-10 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <Moon className="w-[18px] h-[18px] shrink-0 relative z-10 text-muted-foreground group-hover:text-foreground" />
          )}
          <span className="relative z-10">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Logout */}
        <button onClick={logout}
           className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[14px] text-sm font-medium transition-all duration-150 relative group text-destructive/80 hover:text-destructive active:scale-[.99]">
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(239,68,68,.06)" }} />
          <LogOut className="w-[18px] h-[18px] shrink-0 relative z-10" />
          <span className="relative z-10">Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: always-visible panel ── */}
      <div className="hidden md:flex flex-col h-full w-[260px] flex-shrink-0">
        {SidebarContent}
      </div>

      {/* ── Mobile: slide-in drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              style={{ backdropFilter: "blur(4px)" }}
            />
            <motion.div
              key="drawer"
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
               className="fixed left-0 top-0 h-[100dvh] w-[min(86vw,330px)] z-50 md:hidden shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
