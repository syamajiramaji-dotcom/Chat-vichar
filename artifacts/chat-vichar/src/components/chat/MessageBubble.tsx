import { useState, useRef, useEffect } from "react";
import { Message, ReplyTo, MessageMedia } from "@/types/chat";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, Image as ImageIcon, FileVideo, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onReply: (message: Message) => void;
}

export function MessageBubble({ message, isCurrentUser, onReply }: MessageBubbleProps) {
  const [showTime, setShowTime] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full group mb-4",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
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
          {message.replyTo && (
            <div
              className={cn(
                "text-xs p-2 rounded-lg opacity-80 mb-1 max-w-full truncate",
                isCurrentUser ? "bg-primary/20 text-primary-foreground/90 ml-auto" : "bg-muted text-muted-foreground mr-auto"
              )}
            >
              <div className="font-medium text-[10px] mb-0.5">{message.replyTo.senderName}</div>
              {message.replyTo.text ? (
                <div className="truncate">{message.replyTo.text}</div>
              ) : message.replyTo.mediaType ? (
                <div className="flex items-center gap-1">
                  {message.replyTo.mediaType === "image" && <ImageIcon className="w-3 h-3" />}
                  {message.replyTo.mediaType === "video" && <FileVideo className="w-3 h-3" />}
                  {message.replyTo.mediaType === "audio" && <Mic className="w-3 h-3" />}
                  <span>{message.replyTo.mediaType}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-end gap-2 group-hover:gap-3 transition-all">
            {isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => onReply(message)}
              >
                <Reply className="w-3 h-3" />
              </Button>
            )}

            <div
              className={cn(
                "px-4 py-2.5 rounded-2xl relative shadow-sm cursor-pointer",
                isCurrentUser
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border text-card-foreground rounded-bl-sm"
              )}
              onClick={() => setShowTime(!showTime)}
            >
              {message.media && (
                <div className={cn("mb-2 rounded-lg overflow-hidden", !message.text && "mb-0")}>
                  {message.media.mediaType === "image" && (
                    <img
                      src={message.media.url}
                      alt="Attachment"
                      className="max-h-[250px] w-auto object-cover rounded-md"
                      loading="lazy"
                    />
                  )}
                  {message.media.mediaType === "video" && (
                    <video
                      src={message.media.url}
                      controls
                      className="max-h-[250px] w-auto rounded-md"
                    />
                  )}
                  {message.media.mediaType === "audio" && (
                    <audio
                      src={message.media.url}
                      controls
                      className="max-w-[200px] h-10"
                    />
                  )}
                </div>
              )}
              
              {message.text && (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {message.text}
                </p>
              )}

              <div
                className={cn(
                  "text-[10px] mt-1 text-right flex justify-end gap-1 opacity-70",
                  isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {format(message.timestamp, "HH:mm")}
              </div>
            </div>

            {!isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => onReply(message)}
              >
                <Reply className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
