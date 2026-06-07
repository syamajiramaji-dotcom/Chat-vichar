import { useState } from "react";
import { Message } from "@/types/chat";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, Image as ImageIcon, FileVideo, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export type MessageStatus = "sent" | "delivered" | "seen";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  status: MessageStatus;
  onReply: (message: Message) => void;
}

/** WhatsApp-style tick(s) SVG rendered inline */
function StatusTicks({ status }: { status: MessageStatus }) {
  const seen = status === "seen";
  const double = status === "delivered" || status === "seen";
  const color = seen ? "#60a5fa" : "currentColor"; // blue-400 when seen, else inherit

  return (
    <span
      className={cn(
        "inline-flex items-center shrink-0",
        seen ? "text-blue-400" : "text-primary-foreground/50"
      )}
      aria-label={status}
      data-testid={`tick-${status}`}
    >
      {double ? (
        /* Double tick — overlapping checkmarks */
        <svg
          width="18"
          height="11"
          viewBox="0 0 18 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Back check */}
          <polyline
            points="1,5.5 4.5,9 10,2"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Front check (offset right) */}
          <polyline
            points="6,5.5 9.5,9 16,1.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        /* Single tick */
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="1,5.5 4.5,9 10,1.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

export function MessageBubble({ message, isCurrentUser, status, onReply }: MessageBubbleProps) {
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
          {/* Reply preview */}
          {message.replyTo && (
            <div
              className={cn(
                "text-xs p-2 rounded-lg opacity-80 mb-1 max-w-full",
                isCurrentUser
                  ? "bg-primary/20 text-primary-foreground/90 ml-auto"
                  : "bg-muted text-muted-foreground mr-auto"
              )}
            >
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

          <div className="flex items-end gap-2 group-hover:gap-3 transition-all">
            {/* Reply button — left side for own messages */}
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

            {/* Bubble */}
            <div
              className={cn(
                "px-4 py-2.5 rounded-2xl relative shadow-sm cursor-pointer",
                isCurrentUser
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border text-card-foreground rounded-bl-sm"
              )}
              onClick={() => setShowTime(!showTime)}
            >
              {/* Media */}
              {message.media && (
                <div className={cn("rounded-lg overflow-hidden", message.text ? "mb-2" : "mb-0")}>
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
                      className="max-w-[220px] h-10"
                    />
                  )}
                </div>
              )}

              {/* Text */}
              {message.text && (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {message.text}
                </p>
              )}

              {/* Timestamp + ticks row */}
              <div
                className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                <span className="text-[10px]">{format(message.timestamp, "HH:mm")}</span>
                {isCurrentUser && <StatusTicks status={status} />}
              </div>
            </div>

            {/* Reply button — right side for received messages */}
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
