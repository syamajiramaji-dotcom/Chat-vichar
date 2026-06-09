import { useState, useRef, useEffect, useCallback } from "react";
import { Message, ReplyTo } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Image as ImageIcon, Mic, Square, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (args: { text?: string; media?: unknown; replyTo?: ReplyTo }) => Promise<void>;
  replyTo: Message | null;
  onCancelReply: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageInput({ onSendMessage, replyTo, onCancelReply, onTypingStart, onTypingStop }: MessageInputProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const { isRecording, duration, startRecording, stopRecording, cancelRecording, audioBlob, reset: resetVoice } = useVoiceRecorder();

  const scheduleTypingStop = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) { isTypingRef.current = false; onTypingStop(); }
    }, 2000);
  }, [onTypingStop]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
      if (!isTypingRef.current) { isTypingRef.current = true; onTypingStart(); }
      scheduleTypingStop();
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) { isTypingRef.current = false; onTypingStop(); }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) { isTypingRef.current = false; onTypingStop(); }
    };
  }, [onTypingStop]);

  const handleSend = async () => {
    if (!text.trim() && !audioBlob) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) { isTypingRef.current = false; onTypingStop(); }

    let mediaData = undefined;
    if (audioBlob) {
      setIsUploading(true);
      try {
        const file = new File([audioBlob], "voice.webm", { type: "audio/webm" });
        mediaData = await uploadToCloudinary(file, setUploadProgress);
      } catch { /* ignore */ } finally {
        setIsUploading(false); resetVoice();
      }
    }

    const replyObj = replyTo
      ? { messageId: replyTo.id, text: replyTo.text, senderName: replyTo.senderName, mediaType: replyTo.media?.mediaType }
      : undefined;

    await onSendMessage({ text: text.trim() || undefined, media: mediaData, replyTo: replyObj });
    setText("");
    onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); setUploadProgress(0);
    try {
      const mediaData = await uploadToCloudinary(file, setUploadProgress);
      const replyObj = replyTo
        ? { messageId: replyTo.id, text: replyTo.text, senderName: replyTo.senderName, mediaType: replyTo.media?.mediaType }
        : undefined;
      await onSendMessage({ media: mediaData, replyTo: replyObj });
      onCancelReply();
    } catch { /* ignore */ } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => { if (audioBlob) handleSend(); }, [audioBlob]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex flex-col gap-2 p-3"
      style={{
        background: "hsl(228 28% 8%)",
        borderTop: "1px solid rgba(124,58,237,.12)"
      }}>
      {/* Upload progress bar */}
      {isUploading && (
        <div className="absolute top-0 left-0 w-full h-0.5 overflow-hidden">
          <div className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg,#7c3aed,#4f46e5,#818cf8)" }} />
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
          style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.2)" }}>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-xs mb-0.5" style={{ color: "#a78bfa" }}>
              Replying to {replyTo.senderName}
            </span>
            <span className="text-muted-foreground/80 truncate text-xs">
              {replyTo.text || (replyTo.media ? `[${replyTo.media.mediaType}]` : "Message")}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2 text-muted-foreground hover:text-foreground" onClick={onCancelReply}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

        {!isRecording && (
          <Button variant="ghost" size="icon"
            className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 h-11 w-11 rounded-2xl shrink-0 pb-0 transition-colors"
            onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <ImageIcon className="w-5 h-5" />
          </Button>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between rounded-2xl px-4 h-[52px]"
            style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)" }}>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full neon-pulse" />
              <span className="font-mono font-medium text-rose-400">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-muted-foreground hover:text-rose-400 text-xs">Cancel</Button>
              <Button size="icon" onClick={stopRecording}
                className="h-8 w-8 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
                <Square className="w-3 h-3 fill-current" />
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "flex-1 relative rounded-2xl overflow-hidden transition-all duration-200",
            "focus-within:ring-2 focus-within:ring-violet-500/40"
          )}
            style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
            <Textarea
              value={text} onChange={handleTextChange} onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="min-h-[52px] max-h-[150px] resize-none border-0 focus-visible:ring-0 bg-transparent py-3.5 px-4 text-foreground placeholder:text-muted-foreground/40"
              rows={1}
            />
          </div>
        )}

        {!isRecording && (
          <div className="shrink-0">
            {text.trim() ? (
              <Button onClick={handleSend} disabled={isUploading} size="icon"
                className="h-11 w-11 rounded-2xl text-white transition-all active:scale-95 btn-glow"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </Button>
            ) : (
              <Button onClick={startRecording} disabled={isUploading} size="icon"
                className="h-11 w-11 rounded-2xl transition-all active:scale-95 text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10"
                style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
