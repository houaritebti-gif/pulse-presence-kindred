import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
  profiles: string[];
}

interface MessageReactionsProps {
  reactions: ReactionGroup[];
  availableEmojis: string[];
  onToggle: (emoji: string) => void;
  isOwn: boolean;
  disabled?: boolean;
}

export const MessageReactions = ({
  reactions,
  availableEmojis,
  onToggle,
  isOwn,
  disabled = false,
}: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
      {/* Existing reactions */}
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => !disabled && onToggle(reaction.emoji)}
            disabled={disabled}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
              reaction.hasReacted
                ? "bg-accent/30 border border-accent/50"
                : "bg-secondary/50 border border-border/30 hover:bg-secondary"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span>{reaction.emoji}</span>
            <span className="text-muted-foreground">{reaction.count}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPicker(!showPicker)}
          disabled={disabled}
          className={`flex items-center justify-center w-6 h-6 rounded-full bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <Plus className="w-3 h-3" />
        </motion.button>

        {/* Emoji picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              className={`absolute z-50 bottom-full mb-2 ${
                isOwn ? "right-0" : "left-0"
              }`}
            >
              <div className="flex gap-1 p-2 bg-card rounded-xl shadow-lg border border-border/30">
                {availableEmojis.map((emoji) => {
                  const hasReacted = reactions.find(
                    (r) => r.emoji === emoji && r.hasReacted
                  );
                  return (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onToggle(emoji);
                        setShowPicker(false);
                      }}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors ${
                        hasReacted
                          ? "bg-accent/30"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {emoji}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {showPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
