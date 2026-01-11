import { X, Flame, User, Sparkles, Undo2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PresenceActionButtonsProps {
  onPass: () => void;
  onChispa: () => void;
  onSuperChispa: () => void;
  onViewProfile: () => void;
  onUndo?: () => void;
  showUndo?: boolean;
  availableSuperChispas?: number;
  disabled?: boolean;
}

const ActionButton = ({
  onClick,
  icon,
  label,
  variant = "default",
  size = "md",
  badge,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "primary" | "super" | "secondary" | "muted";
  size?: "sm" | "md" | "lg";
  badge?: number;
  disabled?: boolean;
}) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const variantClasses = {
    default: "bg-background border-2 border-border hover:border-foreground/30 text-foreground shadow-lg",
    primary: "bg-primary border-2 border-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30",
    super: "bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 border-2 border-purple-400 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/40",
    secondary: "bg-accent border-2 border-accent hover:bg-accent/80 text-accent-foreground shadow-lg",
    muted: "bg-muted/80 border-2 border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground shadow-md",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (disabled) return;
              triggerHaptic("medium");
              onClick();
            }}
            disabled={disabled}
            className={cn(
              "relative rounded-full flex items-center justify-center transition-all duration-200",
              sizeClasses[size],
              variantClasses[variant],
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={iconSizeClasses[size]}>{icon}</div>
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-[10px] font-bold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const PresenceActionButtons = ({
  onPass,
  onChispa,
  onSuperChispa,
  onViewProfile,
  onUndo,
  showUndo = false,
  availableSuperChispas = 0,
  disabled = false,
}: PresenceActionButtonsProps) => {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {/* Undo button (smaller, appears when available) */}
      {showUndo && onUndo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -20 }}
        >
          <ActionButton
            onClick={onUndo}
            icon={<Undo2 className="w-full h-full" />}
            label="Deshacer"
            variant="muted"
            size="sm"
            disabled={disabled}
          />
        </motion.div>
      )}

      {/* Pass button - X */}
      <ActionButton
        onClick={onPass}
        icon={<X className="w-full h-full" strokeWidth={2.5} />}
        label="Pasar 👋"
        variant="muted"
        size="md"
        disabled={disabled}
      />

      {/* Super Chispa button - Flame (bigger, center-left) */}
      <ActionButton
        onClick={onSuperChispa}
        icon={<Flame className="w-full h-full" />}
        label="Super Chispa 🔥"
        variant="super"
        size="lg"
        badge={availableSuperChispas}
        disabled={disabled}
      />

      {/* Chispa button - Sparkles (primary, center-right) */}
      <ActionButton
        onClick={onChispa}
        icon={<Sparkles className="w-full h-full" />}
        label="Chispa ✨"
        variant="primary"
        size="lg"
        disabled={disabled}
      />

      {/* View Profile button - User */}
      <ActionButton
        onClick={onViewProfile}
        icon={<User className="w-full h-full" />}
        label="Ver perfil 👤"
        variant="secondary"
        size="md"
        disabled={disabled}
      />
    </div>
  );
};

export default PresenceActionButtons;
