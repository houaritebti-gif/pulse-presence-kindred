import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Upload, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadPhase = "compressing" | "uploading" | "complete";

interface UploadProgressProps {
  isVisible: boolean;
  phase: UploadPhase;
  progress: number; // 0-100
  className?: string;
}

const UploadProgress = ({ isVisible, phase, progress, className }: UploadProgressProps) => {
  const getPhaseLabel = () => {
    switch (phase) {
      case "compressing":
        return "Comprimiendo...";
      case "uploading":
        return "Subiendo...";
      case "complete":
        return "¡Completado!";
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case "compressing":
        return <ImageIcon className="w-4 h-4" />;
      case "uploading":
        return <Upload className="w-4 h-4" />;
      case "complete":
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-3",
            className
          )}
        >
          {/* Circular progress */}
          <div className="relative w-16 h-16">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted/30"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={cn(
                  phase === "complete" ? "text-green-500" : "text-primary"
                )}
                strokeDasharray={97.39} // 2 * PI * 15.5
                initial={{ strokeDashoffset: 97.39 }}
                animate={{ strokeDashoffset: 97.39 - (progress / 100) * 97.39 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {phase === "complete" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </motion.div>
              ) : (
                <span className="text-sm font-bold text-foreground">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          </div>

          {/* Phase label */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {getPhaseIcon()}
            <span>{getPhaseLabel()}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadProgress;
