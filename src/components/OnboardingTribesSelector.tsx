import { motion, AnimatePresence } from "framer-motion";
import { Check, Users } from "lucide-react";
import { TRIBES } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingTribesSelectorProps {
  selectedTribes: string[];
  onToggleTribe: (tribe: string) => void;
  maxTribes?: number;
}

const OnboardingTribesSelector = ({
  selectedTribes,
  onToggleTribe,
  maxTribes = 3,
}: OnboardingTribesSelectorProps) => {
  const handleToggle = (tribe: string) => {
    if (!selectedTribes.includes(tribe) && selectedTribes.length >= maxTribes) {
      toast.error(`Máximo ${maxTribes} tribus`);
      return;
    }
    triggerHaptic("selection");
    onToggleTribe(tribe);
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
        staggerChildren: 0.03,
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
        <Users className="w-4 h-4" />
        <span className="text-sm">Elige hasta {maxTribes} tribus (opcional)</span>
      </motion.div>

      {/* Tribes grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {TRIBES.map((tribe) => {
          const isSelected = selectedTribes.includes(tribe.value);
          const isDisabled = !isSelected && selectedTribes.length >= maxTribes;
          return (
            <motion.button
              key={tribe.value}
              type="button"
              onClick={() => handleToggle(tribe.value)}
              disabled={isDisabled}
              variants={itemVariants}
              whileHover={{ scale: isDisabled ? 1 : 1.05 }}
              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm transition-all duration-200",
                "flex items-center gap-1.5 touch-manipulation",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card text-card-foreground hover:bg-card/80 border border-border/30",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span>{tribe.emoji}</span>
              <span>{tribe.value}</span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </motion.button>
          );
        })}
      </div>

      {/* Selection counter */}
      <AnimatePresence>
        {selectedTribes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center pt-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Check className="w-4 h-4" />
              {selectedTribes.length}/{maxTribes} tribus
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingTribesSelector;
