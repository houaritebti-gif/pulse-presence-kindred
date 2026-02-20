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
      <div className="grid grid-cols-2 gap-3">
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
              whileHover={{ scale: isDisabled ? 1 : 1.03 }}
              whileTap={{ scale: isDisabled ? 1 : 0.97 }}
              className={cn(
                "relative p-4 rounded-2xl transition-all duration-200",
                "flex flex-col items-center justify-center gap-2 min-h-[100px]",
                "border-2 touch-manipulation",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "bg-secondary text-secondary-foreground border-secondary shadow-lg shadow-secondary/25"
                  : "bg-foreground text-background border-foreground/80 hover:border-foreground hover:shadow-md",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Selected checkmark */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji */}
              <span className="text-3xl">{vibe.emoji}</span>
              
              {/* Label */}
              <span className="font-bold text-sm">{vibe.value}</span>
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
