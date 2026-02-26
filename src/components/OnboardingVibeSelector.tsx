import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { VIBES } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingVibeSelectorProps {
  selectedVibes: string[];
  onToggleVibe: (vibe: string) => void;
  maxVibes?: number;
}

const OnboardingVibeSelector = ({
  selectedVibes,
  onToggleVibe,
  maxVibes = 3,
}: OnboardingVibeSelectorProps) => {
  const handleSelect = (vibe: string) => {
    if (!selectedVibes.includes(vibe) && selectedVibes.length >= maxVibes) {
      toast.error(`Máximo ${maxVibes} vibras`);
      return;
    }
    triggerHaptic("selection");
    onToggleVibe(vibe);
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      }
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hint */}
      <motion.div 
        className="flex items-center gap-2 text-muted-foreground mb-3"
        variants={itemVariants}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm">Elige hasta {maxVibes} vibras</span>
      </motion.div>

      {/* Grid of vibes */}
      <div className="flex flex-wrap gap-2 justify-center">
        {VIBES.map((vibe) => {
          const isSelected = selectedVibes.includes(vibe.value);
          const isDisabled = !isSelected && selectedVibes.length >= maxVibes;
          return (
            <motion.button
              key={vibe.value}
              type="button"
              onClick={() => handleSelect(vibe.value)}
              disabled={isDisabled}
              variants={itemVariants}
              whileHover={{ scale: isDisabled ? 1 : 1.05 }}
              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm transition-all duration-200",
                "flex items-center gap-1.5 touch-manipulation border",
                isSelected
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-transparent text-foreground border-foreground/60 hover:border-foreground",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span>{vibe.emoji}</span>
              <span className="font-semibold">{vibe.value}</span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </motion.button>
          );
        })}
      </div>

      {/* Selection counter */}
      <AnimatePresence>
        {selectedVibes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center pt-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Check className="w-4 h-4" />
              {selectedVibes.length}/{maxVibes} vibras
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingVibeSelector;
