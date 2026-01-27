import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Upload, CheckCircle, XCircle, RefreshCw, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type UploadPhase = "idle" | "compressing" | "uploading" | "complete" | "error";

interface UploadProgressProps {
  isVisible: boolean;
  phase: UploadPhase;
  progress: number; // 0-100
  className?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const UploadProgress = ({ 
  isVisible, 
  phase, 
  progress, 
  className,
  errorMessage,
  onRetry,
  onCancel,
  showCancel = true 
}: UploadProgressProps) => {
  const getPhaseLabel = () => {
    switch (phase) {
      case "compressing":
        return "Optimizando imagen...";
      case "uploading":
        return progress < 50 ? "Subiendo..." : "Guardando...";
      case "complete":
        return "¡Foto lista!";
      case "error":
        return errorMessage || "Error al subir";
      default:
        return "";
    }
  };

  const getPhaseHint = () => {
    switch (phase) {
      case "compressing":
        return "Reduciendo tamaño";
      case "uploading":
        return "Esto puede tardar en conexiones lentas";
      default:
        return "";
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case "compressing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "uploading":
        return <Upload className="w-4 h-4" />;
      case "complete":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const isError = phase === "error";
  const isProcessing = phase === "compressing" || phase === "uploading";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-4 bg-card/95 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50",
            className
          )}
        >
          {/* Cancel button */}
          {showCancel && isProcessing && onCancel && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onCancel}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}

          {/* Circular progress */}
          <div className="relative w-20 h-20">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-muted/20"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={cn(
                  phase === "complete" ? "text-green-500" : 
                  isError ? "text-destructive" : "text-primary"
                )}
                strokeDasharray={97.39} // 2 * PI * 15.5
                initial={{ strokeDashoffset: 97.39 }}
                animate={{ 
                  strokeDashoffset: isError ? 0 : 97.39 - (progress / 100) * 97.39 
                }}
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
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
              ) : isError ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <XCircle className="w-8 h-8 text-destructive" />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Phase label */}
          <div className="flex flex-col items-center gap-0.5">
            <div className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              isError ? "text-destructive" : phase === "complete" ? "text-green-600" : "text-foreground"
            )}>
              {getPhaseIcon()}
              <span>{getPhaseLabel()}</span>
            </div>
            {isProcessing && (
              <span className="text-xs text-muted-foreground">
                {getPhaseHint()}
              </span>
            )}
          </div>

          {/* Action buttons */}
          {isError && (
            <div className="flex gap-2 mt-1">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reintentar
                </Button>
              )}
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadProgress;
