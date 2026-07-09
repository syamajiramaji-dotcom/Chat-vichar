import { useState, useRef, useCallback, useEffect } from "react";
import { Message } from "@/types/chat";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, Image as ImageIcon, FileVideo, Mic, MoreVertical, Trash2, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type MessageStatus = "sent" | "delivered" | "seen";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000;

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  status: MessageStatus;
  onReply: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string, forEveryone: boolean) => void;
  currentUserUid?: string;
  searchQuery?: string;
  isCurrentMatch?: boolean;
}

function StatusTicks({ status }: { status: MessageStatus }) {
  const seen = status === "seen";
  const double = status === "delivered" || status === "seen";
  const color = seen ? "var(--t-icon-color)" : "rgba(128,128,128,0.6)";
  return (
    <span className="inline-flex items-center shrink-0" aria-label={status} data-testid={`tick-${status}`}>
      {double ? (
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <polyline points="1,5.5 4.5,9 10,2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="6,5.5 9.5,9 16,1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <polyline points="1,5.5 4.5,9 10,1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const lq = query.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lq ? (
          <mark key={i} className="bg-yellow-400/90 text-black rounded-sm px-[1px] not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function MessageMenu({
  isCurrentUser, canDeleteForEveryone, onReply, onDeleteForMe, onDeleteForEveryone, onClose,
}: {
  isCurrentUser: boolean; canDeleteForEveryone: boolean;
  onReply: () => void; onDeleteForMe: () => void; onDeleteForEveryone: () => void; onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div ref={menuRef}
      initial={{ opacity: 0, scale: 0.88, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 4 }} transition={{ duration: 0.12 }}
      className={cn("absolute bottom-full mb-1.5 z-50 min-w-[165px]", isCurrentUser ? "right-0" : "left-0")}
    >
      <div className="rounded-2xl overflow-hidden py-1"
        style={{
          background: "var(--t-menu-bg)",
          border: "1px solid var(--t-menu-border)",
          boxShadow: "0 16px 40px rgba(0,0,0,.25)",
          backdropFilter: "blur(20px)"
        }}>
        <button onClick={() => { onReply(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">
          <Reply className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--t-icon-color)" }} /> Reply
        </button>
        <div className="my-0.5 mx-2 border-t border-border/40" />
        <button onClick={() => { onDeleteForMe(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left">
          <Trash className="w-3.5 h-3.5 shrink-0" /> Delete for Me
        </button>
        {isCurrentUser && canDeleteForEveryone && (
          <button onClick={() => { onDeleteForEveryone(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left">
            <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete for Everyone
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function MessageBubble({
  message, isCurrentUser, status, onReply, onReact, onDelete,
  currentUserUid = "", searchQuery = "", isCurrentMatch = false,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPicker = useCallback(() => setShowPicker(true), []);
  const closePicker = useCallback(() => setShowPicker(false), []);

  const handleMouseEnter = () => { if (showMenu) return; hoverTimer.current = setTimeout(openPicker, 350); };
  const handleMouseLeave = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setTimeout(closePicker, 120); };
  const handlePickerMouseEnter = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setShowPicker(true); };
  const handlePickerMouseLeave = () => setShowPicker(false);
  const handleTouchStart = (e: React.TouchEvent) => {
    e.currentTarget.addEventListener("contextmenu", (ev) => ev.preventDefault(), { once: true });
    longPressTimer.current = setTimeout(() => openPicker(), 500);
  };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const handleTouchMove = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const handleReact = (emoji: string) => { onReact?.(message.id, emoji); setShowPicker(false); };

  const canDeleteForEveryone = isCurrentUser && Date.now() - message.timestamp < DELETE_FOR_EVERYONE_WINDOW_MS;
  const reactionEntries = Object.entries(message.reactions ?? {}).filter(([, uids]) => uids.length > 0);

  // ── Deleted stub ──────────────────────────────────────────────────────────
  if (message.deleted) {
    return (
      <motion.div data-message-id={message.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={cn("flex w-full mb-1", isCurrentUser ? "justify-end" : "justify-start")}>
        <div className={cn("flex max-w-[75%] gap-2", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
          {!isCurrentUser && (
            <Avatar className="w-8 h-8 shrink-0 mt-auto mb-1">
              <AvatarImage src={message.senderPhotoURL || undefined} />
              <AvatarFallback className="text-xs text-white"
                style={{ background: "var(--t-gradient-primary)" }}>
                {(message.senderName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="px-4 py-2.5 rounded-2xl"
            style={{ background: "var(--t-deleted-bg)", border: "1px solid var(--t-deleted-border)" }}>
            <p className="text-[13px] italic text-muted-foreground/70 flex items-center gap-1.5">
              <span>🚫</span><span>This message was deleted</span>
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const actionButtons = (side: "left" | "right") => (
    <div className={cn(
      "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
      side === "left" ? "flex-row" : "flex-row-reverse"
    )}>
      {side === "left" && (
        <Button variant="ghost" size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
          onClick={() => onReply(message)}>
          <Reply className="w-3.5 h-3.5" />
        </Button>
      )}
      <div className="relative">
        <Button variant="ghost" size="icon"
          className={cn("w-7 h-7 rounded-xl", showMenu ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); setShowPicker(false); }}>
          <MoreVertical className="w-3.5 h-3.5" />
        </Button>
        <AnimatePresence>
          {showMenu && (
            <MessageMenu
              isCurrentUser={isCurrentUser} canDeleteForEveryone={canDeleteForEveryone}
              onReply={() => onReply(message)}
              onDeleteForMe={() => onDelete?.(message.id, false)}
              onDeleteForEveryone={() => onDelete?.(message.id, true)}
              onClose={() => setShowMenu(false)}
            />
          )}
        </AnimatePresence>
      </div>
      {side === "right" && (
        <Button variant="ghost" size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
          onClick={() => onReply(message)}>
          <Reply className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );

  return (
    <motion.div data-message-id={message.id}
      initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full group mb-1.5", isCurrentUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[75%] gap-2", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
        {!isCurrentUser && (
          <Avatar className="w-8 h-8 shrink-0 mt-auto mb-1">
            <AvatarImage src={message.senderPhotoURL || undefined} />
            <AvatarFallback className="text-xs text-white"
              style={{ background: "var(--t-gradient-primary)" }}>
              {(message.senderName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex flex-col gap-1">
          {message.replyTo && (
            <div className={cn(
              "text-xs p-2.5 rounded-xl opacity-80 mb-1 max-w-full",
              isCurrentUser ? "ml-auto" : "mr-auto"
            )}
              style={{ background: "var(--t-reply-bg)", border: "1px solid var(--t-reply-border)" }}>
              <div className="font-semibold text-[10px] mb-0.5" style={{ color: "var(--t-icon-color)" }}>
                {message.replyTo.senderName}
              </div>
              {message.replyTo.text ? (
                <div className="truncate text-foreground/70">{message.replyTo.text}</div>
              ) : message.replyTo.mediaType ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  {message.replyTo.mediaType === "image" && <ImageIcon className="w-3 h-3" />}
                  {message.replyTo.mediaType === "video" && <FileVideo className="w-3 h-3" />}
                  {message.replyTo.mediaType === "audio" && <Mic className="w-3 h-3" />}
                  <span className="capitalize">{message.replyTo.mediaType}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-end gap-1.5">
            {isCurrentUser && actionButtons("left")}

            {/* Bubble */}
            <div className="relative flex flex-col"
              onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove}
            >
              {/* Emoji picker */}
              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.85 }} transition={{ duration: 0.14 }}
                    className={cn("absolute bottom-full mb-2 z-50", isCurrentUser ? "right-0" : "left-0")}
                    onMouseEnter={handlePickerMouseEnter} onMouseLeave={handlePickerMouseLeave}
                  >
                    <div className="flex gap-0.5 px-2.5 py-1.5 rounded-full"
                      style={{
                        background: "var(--t-picker-bg)",
                        border: "1px solid var(--t-picker-border)",
                        boxShadow: "0 8px 32px rgba(0,0,0,.2)",
                        backdropFilter: "blur(20px)"
                      }}>
                      {EMOJIS.map((emoji) => {
                        const alreadyReacted = (message.reactions?.[emoji] ?? []).includes(currentUserUid);
                        return (
                          <button key={emoji} onClick={() => handleReact(emoji)}
                            className={cn(
                              "w-9 h-9 text-xl flex items-center justify-center rounded-full transition-all duration-150 hover:scale-125 active:scale-110",
                              alreadyReacted ? "bg-primary/15" : "hover:bg-muted"
                            )}>
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The bubble itself */}
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl relative cursor-pointer",
                  isCurrentUser
                    ? "bubble-sent text-white rounded-br-sm"
                    : "bubble-received text-foreground rounded-bl-sm",
                  isCurrentMatch && "ring-2 ring-yellow-400/70 ring-offset-1 ring-offset-transparent"
                )}
              >
                {/* Media */}
                {message.media && (
                  <div className={cn("rounded-xl overflow-hidden", message.text ? "mb-2" : "mb-0")}>
                    {message.media.mediaType === "image" && (
                      <img src={message.media.url} alt="Attachment"
                        className="max-h-[250px] w-auto object-cover rounded-lg" loading="lazy" />
                    )}
                    {message.media.mediaType === "video" && (
                      <video src={message.media.url} controls className="max-h-[250px] w-auto rounded-lg" />
                    )}
                    {message.media.mediaType === "audio" && (
                      <audio src={message.media.url} controls className="max-w-[220px] h-10" />
                    )}
                  </div>
                )}

                {/* Text */}
                {message.text && (
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    {searchQuery ? <HighlightedText text={message.text} query={searchQuery} /> : message.text}
                  </p>
                )}

                {/* Time + ticks */}
                <div className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  isCurrentUser ? "text-white/50" : "text-muted-foreground/60"
                )}>
                  <span className="text-[10px]">{format(message.timestamp, "HH:mm")}</span>
                  {isCurrentUser && <StatusTicks status={status} />}
                </div>
              </div>

              {/* Reaction pills */}
              <AnimatePresence>
                {reactionEntries.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex flex-wrap gap-1 mt-1.5", isCurrentUser ? "justify-end" : "justify-start")}>
                    {reactionEntries.map(([emoji, uids]) => {
                      const reacted = uids.includes(currentUserUid);
                      return (
                        <motion.button key={emoji} layout
                          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          onClick={() => onReact?.(message.id, emoji)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all select-none"
                          style={reacted ? {
                            background: "var(--t-reaction-active-bg)",
                            border: "1px solid var(--t-reaction-active-border)",
                            color: "var(--t-reaction-active-color)",
                            fontWeight: 600
                          } : {
                            background: "var(--t-reaction-inactive-bg)",
                            border: "1px solid var(--t-reaction-inactive-border)",
                            color: "hsl(var(--foreground))"
                          }}>
                          <span>{emoji}</span><span>{uids.length}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!isCurrentUser && actionButtons("right")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
