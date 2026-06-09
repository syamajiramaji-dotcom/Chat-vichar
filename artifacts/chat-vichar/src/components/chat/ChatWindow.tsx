import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { User } from "firebase/auth";
import { ChatUser, Message } from "@/types/chat";
import { getChatId, useMessages } from "@/hooks/useMessages";
import { useChatSeen } from "@/hooks/useChatSeen";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { socket } from "@/lib/socket";
import { MessageBubble, MessageStatus } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  currentUser: User;
  selectedUser: ChatUser;
  onBack: () => void;
}

function getMessageStatus(
  message: Message,
  currentUid: string,
  recipientOnline: boolean,
  recipientSeenAt: number
): MessageStatus {
  if (message.senderId !== currentUid) return "sent";
  if (recipientSeenAt > 0 && message.timestamp <= recipientSeenAt) return "seen";
  if (recipientOnline) return "delivered";
  return "sent";
}

export function ChatWindow({ currentUser, selectedUser, onBack }: ChatWindowProps) {
  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  const { messages, sendMessage, deleteMessage } = useMessages(chatId, currentUser.uid, selectedUser.uid);
  const recipientSeenAt = useChatSeen(chatId, currentUser.uid, selectedUser.uid);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  usePushNotifications(currentUser.uid);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const matchedIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => !m.deleted && m.text?.toLowerCase().includes(q)).map((m) => m.id);
  }, [messages, searchQuery]);

  useEffect(() => { setCurrentMatchIdx(0); }, [matchedIds.length, searchQuery]);

  useEffect(() => {
    if (matchedIds.length === 0) return;
    const el = document.querySelector(`[data-message-id="${matchedIds[currentMatchIdx]}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentMatchIdx, matchedIds]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 60);
  }, []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false); setSearchQuery(""); setCurrentMatchIdx(0);
  }, []);
  const goNext = useCallback(() => {
    if (matchedIds.length === 0) return;
    setCurrentMatchIdx((i) => (i + 1) % matchedIds.length);
  }, [matchedIds.length]);
  const goPrev = useCallback(() => {
    if (matchedIds.length === 0) return;
    setCurrentMatchIdx((i) => (i - 1 + matchedIds.length) % matchedIds.length);
  }, [matchedIds.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); if (!searchOpen) openSearch(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, openSearch, closeSearch]);

  useEffect(() => { closeSearch(); }, [selectedUser.uid]);

  useEffect(() => {
    const handleTyping = ({ chatId: cid, uid, isTyping }: { chatId: string; uid: string; isTyping: boolean }) => {
      if (cid !== chatId || uid !== selectedUser.uid) return;
      setIsRecipientTyping(isTyping);
      if (isTyping) {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        typingClearRef.current = setTimeout(() => setIsRecipientTyping(false), 4000);
      } else {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
      }
    };
    socket.on("typing", handleTyping);
    return () => { socket.off("typing", handleTyping); if (typingClearRef.current) clearTimeout(typingClearRef.current); };
  }, [chatId, selectedUser.uid]);

  useEffect(() => {
    if (searchOpen && searchQuery) return;
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isRecipientTyping, searchOpen, searchQuery]);

  const handleSendMessage = async (args: Parameters<typeof sendMessage>[0]) => {
    await sendMessage({ ...args, senderName: currentUser.displayName || "User", senderPhotoURL: currentUser.photoURL });
  };
  const handleTypingStart = () => socket.emit("typing_start", { chatId, recipientUid: selectedUser.uid });
  const handleTypingStop = () => socket.emit("typing_stop", { chatId, recipientUid: selectedUser.uid });
  const handleReact = useCallback((messageId: string, emoji: string) => {
    socket.emit("react_message", { chatId, messageId, emoji, recipientUid: selectedUser.uid });
  }, [chatId, selectedUser.uid]);
  const handleDelete = useCallback((messageId: string, forEveryone: boolean) => {
    deleteMessage(messageId, forEveryone);
  }, [deleteMessage]);

  const contactName = selectedUser.displayName || selectedUser.email || "Unknown";

  const headerSubline = isRecipientTyping ? (
    <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#a78bfa" }}>
      typing
      <span className="inline-flex gap-[3px] items-end mb-[1px]">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-[3px] h-[3px] rounded-full animate-bounce"
            style={{ background: "#a78bfa", animationDelay: `${d}ms` }} />
        ))}
      </span>
    </span>
  ) : (
    <span className={`text-xs ${selectedUser.online ? "text-green-400" : "text-muted-foreground"}`}>
      {selectedUser.online
        ? "● Online"
        : selectedUser.lastSeen
        ? `Last seen ${formatDistanceToNow(selectedUser.lastSeen, { addSuffix: true })}`
        : "Offline"}
    </span>
  );

  return (
    <div className="flex flex-col h-full w-full relative" style={{ background: "hsl(228 28% 6%)" }}>

      {/* ── Premium Header ── */}
      <div className="gradient-chat-header shrink-0 z-10 sticky top-0">
        <div className="h-16 flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}
            className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-white/[.06] rounded-xl mr-0.5">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 ring-2 ring-violet-500/25">
                <AvatarImage src={selectedUser.photoURL || undefined} />
                <AvatarFallback className="text-white font-semibold"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {(contactName).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedUser.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[hsl(228,28%,8%)] neon-online" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate leading-tight">{contactName}</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isRecipientTyping ? "typing" : "status"}
                  initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 3 }}
                  transition={{ duration: 0.15 }}
                >
                  {headerSubline}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={searchOpen ? closeSearch : openSearch}
            className={`h-9 w-9 shrink-0 rounded-xl transition-all ${searchOpen ? "text-violet-400 bg-violet-500/15" : "text-muted-foreground hover:bg-white/[.06]"}`}
            title="Search messages (Ctrl+F)">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") e.shiftKey ? goPrev() : goNext(); }}
                  placeholder="Search messages…"
                  className="h-8 border-0 shadow-none focus-visible:ring-0 bg-transparent px-1 text-sm flex-1 text-foreground placeholder:text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground shrink-0 min-w-[48px] text-center">
                  {searchQuery.trim() ? matchedIds.length === 0 ? "No results" : `${currentMatchIdx + 1} / ${matchedIds.length}` : ""}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  {[{ icon: ChevronUp, fn: goPrev, label: "Prev" }, { icon: ChevronDown, fn: goNext, label: "Next" }].map(({ icon: Icon, fn, label }) => (
                    <Button key={label} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={fn} disabled={matchedIds.length <= 1}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0" onClick={closeSearch}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6"
        style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(124,58,237,.04) 0%, transparent 60%), hsl(228 28% 6%)" }}>
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground m-auto py-20 space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.2)" }}>
                  <Avatar className="h-14 w-14 opacity-60 grayscale">
                    <AvatarImage src={selectedUser.photoURL || undefined} />
                    <AvatarFallback className="text-lg">{contactName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute inset-0 rounded-full blur-xl opacity-30"
                  style={{ background: "radial-gradient(circle, rgba(124,58,237,.4), transparent)" }} />
              </div>
              <div>
                <p className="text-foreground/70 font-medium">Chat with {selectedUser.displayName || "this user"}</p>
                <p className="text-sm text-muted-foreground mt-1">Say hello to start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.uid;
                const status = getMessageStatus(msg, currentUser.uid, selectedUser.online, recipientSeenAt);
                const isCurrentMatch = matchedIds.length > 0 && matchedIds[currentMatchIdx] === msg.id;
                const isAnyMatch = matchedIds.includes(msg.id);
                return (
                  <MessageBubble
                    key={msg.id} message={msg} isCurrentUser={isCurrentUser} status={status}
                    onReply={setReplyTo} onReact={handleReact} onDelete={handleDelete}
                    currentUserUid={currentUser.uid}
                    searchQuery={isAnyMatch ? searchQuery : ""}
                    isCurrentMatch={isCurrentMatch}
                  />
                );
              })}

              {/* Typing bubble */}
              <AnimatePresence>
                {isRecipientTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.18 }}
                    className="flex items-end gap-2 mb-4"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={selectedUser.photoURL || undefined} />
                      <AvatarFallback className="text-xs text-white"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                        {contactName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bubble-received rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-[5px]">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: "rgba(167,139,250,.6)", animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 w-full max-w-4xl mx-auto">
        <MessageInput
          onSendMessage={handleSendMessage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>
    </div>
  );
}
