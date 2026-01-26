import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "success" | "error";

interface SaveProfileButtonProps {
  onClick: () => void;
  hasChanges: boolean;
  saveState: SaveState;
  errorMessage?: string;
  className?: string;
}

export const SaveProfileButton = ({
  onClick,
  hasChanges,
  saveState,
  errorMessage,
  className,
}: SaveProfileButtonProps) => {
  const getButtonContent = () => {
    switch (saveState) {
      case "saving":
        return (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Guardando...</span>
          </motion.div>
        );
      case "success":
        return (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
            <span>¡Guardado!</span>
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ x: [0, -3, 3, -3, 3, 0] }}
              transition={{ duration: 0.4 }}
            >
              <AlertCircle className="w-5 h-5" />
            </motion.div>
            <span>Reintentar</span>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>Guardar cambios</span>
          </motion.div>
        );
    }
  };

  const getButtonVariant = () => {
    switch (saveState) {
      case "success":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "error":
        return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
      default:
        return "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        onClick={onClick}
        disabled={!hasChanges || saveState === "saving" || saveState === "success"}
        className={cn(
          "w-full h-14 text-base font-semibold transition-all duration-300",
          getButtonVariant(),
          hasChanges && saveState === "idle" && "animate-pulse-soft"
        )}
      >
        <AnimatePresence mode="wait">
          {getButtonContent()}
        </AnimatePresence>
      </Button>

      {/* Error message */}
      <AnimatePresence>
        {saveState === "error" && errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-body">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved changes indicator */}
      <AnimatePresence>
        {hasChanges && saveState === "idle" && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-center text-muted-foreground font-body"
          >
            Tienes cambios sin guardar
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaveProfileButton;
