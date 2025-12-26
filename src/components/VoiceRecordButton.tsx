import { useState } from "react";
import { Mic, Square, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isUploading: boolean;
  formattedDuration: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

const VoiceRecordButton = ({
  isRecording,
  isUploading,
  formattedDuration,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}: VoiceRecordButtonProps) => {
  if (isUploading) {
    return (
      <div className="h-12 w-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        {/* Cancel button */}
        <button
          type="button"
          onClick={onCancelRecording}
          className="h-10 w-10 rounded-full bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Recording indicator */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2 h-2 rounded-full bg-destructive"
          />
          <span className="font-body text-sm text-destructive font-medium">
            {formattedDuration}
          </span>
        </motion.div>

        {/* Stop button */}
        <button
          type="button"
          onClick={onStopRecording}
          className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onStartRecording}
      className="h-12 w-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};

export default VoiceRecordButton;
