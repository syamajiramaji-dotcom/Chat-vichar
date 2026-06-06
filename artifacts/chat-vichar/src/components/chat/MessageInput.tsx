import { useState, useRef, useEffect } from "react";
import { Message, ReplyTo } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Image as ImageIcon, FileVideo, Mic, Square, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (args: {
    text?: string;
    media?: any;
    replyTo?: ReplyTo;
  }) => Promise<void>;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export function MessageInput({ onSendMessage, replyTo, onCancelReply }: MessageInputProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    reset: resetVoice
  } = useVoiceRecorder();

  const handleSend = async () => {
    if (!text.trim() && !audioBlob) return;
    
    let mediaData = undefined;
    
    if (audioBlob) {
      setIsUploading(true);
      try {
        const file = new File([audioBlob], "voice.webm", { type: "audio/webm" });
        mediaData = await uploadToCloudinary(file, setUploadProgress);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
        resetVoice();
      }
    }

    const replyObj = replyTo ? {
      messageId: replyTo.id,
      text: replyTo.text,
      senderName: replyTo.senderName,
      mediaType: replyTo.media?.mediaType
    } : undefined;

    await onSendMessage({
      text: text.trim() ? text.trim() : undefined,
      media: mediaData,
      replyTo: replyObj
    });

    setText("");
    onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const mediaData = await uploadToCloudinary(file, setUploadProgress);
      const replyObj = replyTo ? {
        messageId: replyTo.id,
        text: replyTo.text,
        senderName: replyTo.senderName,
        mediaType: replyTo.media?.mediaType
      } : undefined;

      await onSendMessage({
        media: mediaData,
        replyTo: replyObj
      });
      onCancelReply();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Voice recording stop handler
  useEffect(() => {
    if (audioBlob) {
      handleSend();
    }
  }, [audioBlob]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 bg-background border-t border-border flex flex-col gap-2 relative">
      {isUploading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {replyTo && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border text-sm mb-2">
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-xs text-primary mb-0.5">Replying to {replyTo.senderName}</span>
            <span className="text-muted-foreground truncate">
              {replyTo.text || (replyTo.media ? `[${replyTo.media.mediaType}]` : "Message")}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2" onClick={onCancelReply}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*"
          onChange={handleFileSelect} 
        />
        
        {!isRecording && (
          <div className="flex gap-1 shrink-0 pb-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-2 h-[52px]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
              <span className="text-destructive font-medium font-mono">
                {formatDuration(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-muted-foreground hover:text-destructive">
                Cancel
              </Button>
              <Button variant="destructive" size="icon" onClick={stopRecording} className="h-8 w-8 rounded-full">
                <Square className="w-3 h-3 fill-current" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative bg-card border border-border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[52px] max-h-[150px] resize-none border-0 focus-visible:ring-0 bg-transparent py-3.5 px-4 scrollbar-thin"
              rows={1}
            />
          </div>
        )}

        {!isRecording && (
          <div className="shrink-0 pb-1 flex gap-1">
            {text.trim() ? (
              <Button 
                onClick={handleSend} 
                disabled={isUploading}
                size="icon" 
                className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform active:scale-95"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </Button>
            ) : (
              <Button 
                onClick={startRecording}
                disabled={isUploading}
                variant="secondary"
                size="icon" 
                className="h-10 w-10 rounded-full transition-transform active:scale-95"
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
