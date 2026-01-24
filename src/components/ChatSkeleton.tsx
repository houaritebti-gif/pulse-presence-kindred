import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MessageBubbleSkeleton = ({ 
  isOwn = false, 
  delay = 0 
}: { 
  isOwn?: boolean; 
  delay?: number;
}) => (
  <div 
    className={cn(
      "flex gap-2 opacity-0 animate-fade-up",
      isOwn ? "justify-end" : "justify-start"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    {!isOwn && (
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    )}
    <div className={cn(
      "space-y-1",
      isOwn ? "items-end" : "items-start"
    )}>
      <Skeleton 
        className={cn(
          "h-10 rounded-2xl",
          isOwn 
            ? "w-32 rounded-tr-sm" 
            : "w-48 rounded-tl-sm"
        )} 
      />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

interface ChatSkeletonProps {
  messageCount?: number;
  /** For spark/quedada chats with header */
  showHeader?: boolean;
  /** Show typing indicator skeleton */
  showTyping?: boolean;
}

export const ChatSkeleton = memo(({ 
  messageCount = 6,
  showHeader = true,
  showTyping = false
}: ChatSkeletonProps) => {
  // Generate alternating message pattern
  const messages = Array.from({ length: messageCount }).map((_, i) => ({
    isOwn: i % 3 === 2, // Every 3rd message is own
    delay: i * 60
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Chat header skeleton */}
      {showHeader && (
        <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/50">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-20" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {/* Date divider */}
        <div className="flex items-center justify-center py-2">
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        
        {/* Message bubbles */}
        {messages.map((msg, index) => (
          <MessageBubbleSkeleton 
            key={index} 
            isOwn={msg.isOwn} 
            delay={msg.delay} 
          />
        ))}
        
        {/* Typing indicator */}
        {showTyping && (
          <div className="flex items-center gap-2 opacity-0 animate-fade-up" style={{ animationDelay: `${messageCount * 60 + 100}ms` }}>
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-2xl rounded-tl-sm" />
          </div>
        )}
      </div>

      {/* Input area skeleton */}
      <div className="p-4 border-t border-border/50 bg-card/30">
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
});

ChatSkeleton.displayName = "ChatSkeleton";

export default ChatSkeleton;
