import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { ReactNode } from "react";

interface OnboardingOptionCardProps {
  icon?: ReactNode;
  emoji?: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  variant?: "default" | "large" | "compact";
  className?: string;
}

const OnboardingOptionCard = ({
  icon,
  emoji,
  label,
  isSelected,
  onClick,
  variant = "default",
  className,
}: OnboardingOptionCardProps) => {
  const handleClick = () => {
    triggerHaptic("selection");
    onClick();
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "tween" as const,
        duration: 0.2,
      }
    },
  };

  if (variant === "large") {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative w-full p-5 rounded-2xl text-base transition-all duration-200",
          "border-2 shadow-sm touch-manipulation",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/20"
            : "bg-foreground text-background border-foreground/80 hover:border-primary/60 hover:shadow-md",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {emoji && <span className="text-2xl">{emoji}</span>}
            {icon && <span className="w-6 h-6">{icon}</span>}
            <span className="font-semibold">{label}</span>
          </div>
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    );
  }

  if (variant === "compact") {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "px-4 py-2.5 rounded-full text-sm transition-all duration-200",
          "flex items-center gap-1.5 touch-manipulation active:scale-95",
          isSelected
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
            : "bg-foreground text-background hover:bg-foreground/90 border border-foreground/80",
          className
        )}
      >
        {emoji && <span>{emoji}</span>}
        <span>{label}</span>
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      type="button"
      onClick={handleClick}
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-4 rounded-2xl text-base transition-all duration-200",
        "flex items-center justify-between touch-manipulation",
        "border border-transparent",
        isSelected
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
          : "bg-foreground text-background hover:bg-foreground/90 border-foreground/80",
        className
      )}
    >
      <span className="flex items-center gap-3">
        {emoji && <span className="text-xl">{emoji}</span>}
        {icon && <span className="w-5 h-5">{icon}</span>}
        <span>{label}</span>
      </span>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Check className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default OnboardingOptionCard;
