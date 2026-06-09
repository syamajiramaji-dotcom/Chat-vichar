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
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

/** WhatsApp-style tick(s) SVG */
function StatusTicks({ status }: { status: MessageStatus }) {
  const seen = status === "seen";
  const double = status === "delivered" || status === "seen";
  const color = seen ? "#60a5fa" : "currentColor";

  return (
    <span
      className={cn("inline-flex items-center shrink-0", seen ? "text-blue-400" : "text-primary-foreground/50")}
      aria-label={status}
      data-testid={`tick-${status}`}
    >
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

/** Highlights occurrences of `query` inside `text` */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const lq = query.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lq ? (
          <mark key={i} className="bg-yellow-300 text-yellow-900 rounded-sm px-[1px] not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Compact context menu that appears on ⋮ click */
function MessageMenu({
  isCurrentUser,
  canDeleteForEveryone,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: {
  isCurrentUser: boolean;
  canDeleteForEveryone: boolean;
  onReply: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 4 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "absolute bottom-full mb-1.5 z-50 min-w-[160px]",
        isCurrentUser ? "right-0" : "left-0"
      )}
    >
      <div className="bg-popover border border-border rounded-xl shadow-xl shadow-black/10 overflow-hidden py-1">
        <button
          onClick={() => { onReply(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
        >
          <Reply className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          Reply
        </button>

        <div className="my-1 border-t border-border/60" />

        <button
          onClick={() => { onDeleteForMe(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
        >
          <Trash className="w-3.5 h-3.5 shrink-0" />
          Delete for Me
        </button>

        {isCurrentUser && canDeleteForEveryone && (
          <button
            onClick={() => { onDeleteForEveryone(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            Delete for Everyone
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function MessageBubble({
  message,
  isCurrentUser,
  status,
  onReply,
  onReact,
  onDelete,
  currentUserUid = "",
  searchQuery = "",
  isCurrentMatch = false,
}: MessageBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPicker = useCallback(() => setShowPicker(true), []);
  const closePicker = useCallback(() => setShowPicker(false), []);

  const handleMouseEnter = () => {
    if (showMenu) return;
    hoverTimer.current = setTimeout(openPicker, 350);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setTimeout(closePicker, 120);
  };
  const handlePickerMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowPicker(true);
  };
  const handlePickerMouseLeave = () => setShowPicker(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.currentTarget.addEventListener("contextmenu", (ev) => ev.preventDefault(), { once: true });
    longPressTimer.current = setTimeout(() => openPicker(), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
  const handleTouchMove = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleReact = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowPicker(false);
  };

  const canDeleteForEveryone =
    isCurrentUser && Date.now() - message.timestamp < DELETE_FOR_EVERYONE_WINDOW_MS;

  const reactionEntries = Object.entries(message.reactions ?? {}).filter(
    ([, uids]) => uids.length > 0
  );

  // ── Deleted message stub ──────────────────────────────────────────────────
  if (message.deleted) {
    return (
      <motion.div
        data-message-id={message.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex w-full mb-1", isCurrentUser ? "justify-end" : "justify-start")}
      >
        <div className={cn("flex max-w-[75%] gap-2", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
          {!isCurrentUser && (
            <Avatar className="w-8 h-8 shrink-0 mt-auto mb-1">
              <AvatarImage src={message.senderPhotoURL || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {(message.senderName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl shadow-sm border",
              isCurrentUser
                ? "bg-primary/5 border-primary/20 rounded-br-sm"
                : "bg-muted/50 border-border rounded-bl-sm"
            )}
          >
            <p className="text-[13px] italic text-muted-foreground flex items-center gap-1.5">
              <span>🚫</span>
              <span>This message was deleted</span>
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-message-id={message.id}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full group mb-1", isCurrentUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[75%] gap-2", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
        {!isCurrentUser && (
          <Avatar className="w-8 h-8 shrink-0 mt-auto mb-1">
            <AvatarImage src={message.senderPhotoURL || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {(message.senderName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex flex-col gap-1">
          {/* Reply preview */}
          {message.replyTo && (
            <div className={cn(
              "text-xs p-2 rounded-lg opacity-80 mb-1 max-w-full",
              isCurrentUser ? "bg-primary/20 text-primary-foreground/90 ml-auto" : "bg-muted text-muted-foreground mr-auto"
            )}>
              <div className="font-semibold text-[10px] mb-0.5">{message.replyTo.senderName}</div>
              {message.replyTo.text ? (
                <div className="truncate">{message.replyTo.text}</div>
              ) : message.replyTo.mediaType ? (
                <div className="flex items-center gap-1">
                  {message.replyTo.mediaType === "image" && <ImageIcon className="w-3 h-3" />}
                  {message.replyTo.mediaType === "video" && <FileVideo className="w-3 h-3" />}
                  {message.replyTo.mediaType === "audio" && <Mic className="w-3 h-3" />}
                  <span className="capitalize">{message.replyTo.mediaType}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-end gap-1.5 group-hover:gap-2 transition-all">
            {/* Action buttons — left side for own messages */}
            {isCurrentUser && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onReply(message)}
                >
                  <Reply className="w-3 h-3" />
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-6 h-6 text-muted-foreground hover:text-foreground",
                      showMenu && "text-foreground bg-muted"
                    )}
                    onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); setShowPicker(false); }}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                  <AnimatePresence>
                    {showMenu && (
                      <MessageMenu
                        isCurrentUser={isCurrentUser}
                        canDeleteForEveryone={canDeleteForEveryone}
                        onReply={() => onReply(message)}
                        onDeleteForMe={() => onDelete?.(message.id, false)}
                        onDeleteForEveryone={() => onDelete?.(message.id, true)}
                        onClose={() => setShowMenu(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Bubble wrapper — hover/long-press zone for emoji picker */}
            <div
              className="relative flex flex-col"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            >
              {/* ── Emoji Picker ── */}
              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.85 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className={cn(
                      "absolute bottom-full mb-2 z-50",
                      isCurrentUser ? "right-0" : "left-0"
                    )}
                    onMouseEnter={handlePickerMouseEnter}
                    onMouseLeave={handlePickerMouseLeave}
                  >
                    <div className="flex gap-0.5 bg-card border border-border rounded-full px-2.5 py-1.5 shadow-xl shadow-black/10">
                      {EMOJIS.map((emoji) => {
                        const alreadyReacted = (message.reactions?.[emoji] ?? []).includes(currentUserUid);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(emoji)}
                            className={cn(
                              "w-9 h-9 text-xl flex items-center justify-center rounded-full transition-all duration-150 hover:scale-125 active:scale-110",
                              alreadyReacted ? "bg-primary/15" : "hover:bg-muted"
                            )}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Bubble ── */}
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl relative shadow-sm cursor-pointer transition-shadow duration-200",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-card-foreground rounded-bl-sm",
                  isCurrentMatch && "ring-2 ring-yellow-400 ring-offset-1 shadow-yellow-200/50 shadow-lg"
                )}
                onClick={() => setShowTime(!showTime)}
              >
                {/* Media */}
                {message.media && (
                  <div className={cn("rounded-lg overflow-hidden", message.text ? "mb-2" : "mb-0")}>
                    {message.media.mediaType === "image" && (
                      <img src={message.media.url} alt="Attachment" className="max-h-[250px] w-auto object-cover rounded-md" loading="lazy" />
                    )}
                    {message.media.mediaType === "video" && (
                      <video src={message.media.url} controls className="max-h-[250px] w-auto rounded-md" />
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

                {/* Timestamp + ticks */}
                <div className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  <span className="text-[10px]">{format(message.timestamp, "HH:mm")}</span>
                  {isCurrentUser && <StatusTicks status={status} />}
                </div>
              </div>

              {/* ── Reaction pills ── */}
              <AnimatePresence>
                {reactionEntries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex flex-wrap gap-1 mt-1.5", isCurrentUser ? "justify-end" : "justify-start")}
                  >
                    {reactionEntries.map(([emoji, uids]) => {
                      const reacted = uids.includes(currentUserUid);
                      return (
                        <motion.button
                          key={emoji}
                          layout
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          onClick={() => onReact?.(message.id, emoji)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors select-none",
                            reacted
                              ? "bg-primary/15 border-primary/40 text-primary font-medium"
                              : "bg-card border-border text-foreground hover:bg-muted"
                          )}
                        >
                          <span>{emoji}</span>
                          <span>{uids.length}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action buttons — right side for received messages */}
            {!isCurrentUser && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-6 h-6 text-muted-foreground hover:text-foreground",
                      showMenu && "text-foreground bg-muted"
                    )}
                    onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); setShowPicker(false); }}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                  <AnimatePresence>
                    {showMenu && (
                      <MessageMenu
                        isCurrentUser={isCurrentUser}
                        canDeleteForEveryone={canDeleteForEveryone}
                        onReply={() => onReply(message)}
                        onDeleteForMe={() => onDelete?.(message.id, false)}
                        onDeleteForEveryone={() => onDelete?.(message.id, true)}
                        onClose={() => setShowMenu(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onReply(message)}
                >
                  <Reply className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
