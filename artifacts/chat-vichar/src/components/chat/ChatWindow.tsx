import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { User } from "firebase/auth";
import { ChatUser, Message } from "@/types/chat";
import { getChatId, useMessages } from "@/hooks/useMessages";
import { useChatSeen } from "@/hooks/useChatSeen";
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
  const { messages, sendMessage } = useMessages(chatId, currentUser.uid, selectedUser.uid);
  const recipientSeenAt = useChatSeen(chatId, currentUser.uid, selectedUser.uid);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Search state ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // IDs of messages that contain the search query
  const matchedIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.text?.toLowerCase().includes(q)).map((m) => m.id);
  }, [messages, searchQuery]);

  // Reset current index whenever the result set changes
  useEffect(() => {
    setCurrentMatchIdx(0);
  }, [matchedIds.length, searchQuery]);

  // Scroll to current match
  useEffect(() => {
    if (matchedIds.length === 0) return;
    const id = matchedIds[currentMatchIdx];
    const el = document.querySelector(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentMatchIdx, matchedIds]);

  // Open search bar
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 60);
  }, []);

  // Close and clear search
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIdx(0);
  }, []);

  // Navigate between matches
  const goNext = useCallback(() => {
    if (matchedIds.length === 0) return;
    setCurrentMatchIdx((i) => (i + 1) % matchedIds.length);
  }, [matchedIds.length]);

  const goPrev = useCallback(() => {
    if (matchedIds.length === 0) return;
    setCurrentMatchIdx((i) => (i - 1 + matchedIds.length) % matchedIds.length);
  }, [matchedIds.length]);

  // Keyboard shortcut: Escape closes search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        if (!searchOpen) openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, openSearch, closeSearch]);

  // Clear search when switching chats
  useEffect(() => {
    closeSearch();
  }, [selectedUser.uid]);

  // --- Typing indicators ---
  useEffect(() => {
    const handleTyping = ({
      chatId: incomingChatId,
      uid,
      isTyping,
    }: { chatId: string; uid: string; isTyping: boolean }) => {
      if (incomingChatId !== chatId || uid !== selectedUser.uid) return;
      setIsRecipientTyping(isTyping);
      if (isTyping) {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        typingClearRef.current = setTimeout(() => setIsRecipientTyping(false), 4000);
      } else {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
      }
    };
    socket.on("typing", handleTyping);
    return () => {
      socket.off("typing", handleTyping);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [chatId, selectedUser.uid]);

  // Auto-scroll to bottom on new messages (only if not searching)
  useEffect(() => {
    if (searchOpen && searchQuery) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isRecipientTyping, searchOpen, searchQuery]);

  const handleSendMessage = async (args: any) => {
    await sendMessage({
      ...args,
      senderName: currentUser.displayName || "User",
      senderPhotoURL: currentUser.photoURL,
    });
  };

  const handleTypingStart = () => socket.emit("typing_start", { chatId, recipientUid: selectedUser.uid });
  const handleTypingStop = () => socket.emit("typing_stop", { chatId, recipientUid: selectedUser.uid });

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      socket.emit("react_message", { chatId, messageId, emoji, recipientUid: selectedUser.uid });
    },
    [chatId, selectedUser.uid]
  );

  const headerSubline = isRecipientTyping ? (
    <span className="text-xs text-primary font-medium flex items-center gap-1">
      typing
      <span className="inline-flex gap-[3px] items-end mb-[1px]">
        <span className="w-[3px] h-[3px] rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="w-[3px] h-[3px] rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="w-[3px] h-[3px] rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </span>
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">
      {selectedUser.online
        ? "Online"
        : selectedUser.lastSeen
        ? `Last seen ${formatDistanceToNow(selectedUser.lastSeen, { addSuffix: true })}`
        : "Offline"}
    </span>
  );

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md shrink-0 z-10 sticky top-0">
        <div className="h-16 flex items-center px-4 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden mr-1 h-8 w-8 text-muted-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(selectedUser.displayName || selectedUser.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedUser.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate">
                {selectedUser.displayName || selectedUser.email || "Unknown"}
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isRecipientTyping ? "typing" : "status"}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  {headerSubline}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={searchOpen ? closeSearch : openSearch}
            className={`h-9 w-9 shrink-0 transition-colors ${searchOpen ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            title="Search messages (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Search bar (slides in below header) ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/50"
            >
              <div className="flex items-center gap-2 px-4 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.shiftKey ? goPrev() : goNext();
                  }}
                  placeholder="Search messages…"
                  className="h-8 border-0 shadow-none focus-visible:ring-0 bg-transparent px-1 text-sm flex-1"
                />

                {/* Match counter */}
                <span className="text-xs text-muted-foreground shrink-0 min-w-[48px] text-center">
                  {searchQuery.trim()
                    ? matchedIds.length === 0
                      ? "No results"
                      : `${currentMatchIdx + 1} / ${matchedIds.length}`
                    : ""}
                </span>

                {/* Prev / Next */}
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={goPrev}
                    disabled={matchedIds.length <= 1}
                    title="Previous match (Shift+Enter)"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={goNext}
                    disabled={matchedIds.length <= 1}
                    title="Next match (Enter)"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground shrink-0"
                  onClick={closeSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 m-auto py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                <Avatar className="h-12 w-12 opacity-50 grayscale">
                  <AvatarImage src={selectedUser.photoURL || undefined} />
                  <AvatarFallback>
                    {(selectedUser.displayName || selectedUser.email || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p>This is the beginning of your chat with {selectedUser.displayName || "this user"}.</p>
              <p className="text-sm">Say hello!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser.uid;
                const status = getMessageStatus(msg, currentUser.uid, selectedUser.online, recipientSeenAt);
                const isCurrentMatch =
                  matchedIds.length > 0 && matchedIds[currentMatchIdx] === msg.id;
                const isAnyMatch = matchedIds.includes(msg.id);

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isCurrentUser={isCurrentUser}
                    status={status}
                    onReply={setReplyTo}
                    onReact={handleReact}
                    currentUserUid={currentUser.uid}
                    searchQuery={isAnyMatch ? searchQuery : ""}
                    isCurrentMatch={isCurrentMatch}
                  />
                );
              })}

              {/* Typing indicator bubble */}
              <AnimatePresence>
                {isRecipientTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-end gap-2 mb-4"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={selectedUser.photoURL || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(selectedUser.displayName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-[5px]">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
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
