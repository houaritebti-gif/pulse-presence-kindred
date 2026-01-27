import { motion, AnimatePresence } from "framer-motion";
import { Check, Target } from "lucide-react";
import { LOOKING_FOR_OPTIONS } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface OnboardingLookingForSelectorProps {
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
}

const OnboardingLookingForSelector = ({
  selectedOptions,
  onToggleOption,
}: OnboardingLookingForSelectorProps) => {
  const handleToggle = (option: string) => {
    triggerHaptic("selection");
    onToggleOption(option);
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
        className="flex items-center gap-2 text-muted-foreground mb-4"
        variants={itemVariants}
      >
        <Target className="w-4 h-4" />
        <span className="text-sm">Selecciona todas las que apliquen</span>
      </motion.div>

      {/* Options grid */}
      <div className="flex flex-wrap gap-3 justify-center">
        {LOOKING_FOR_OPTIONS.map((option) => {
          const isSelected = selectedOptions.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-sm transition-all duration-200",
                "flex items-center gap-2 touch-manipulation",
                "border-2",
                isSelected
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card text-card-foreground border-border/40 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
              )}
            >
              <span className="text-lg">{option.emoji}</span>
              <span className="font-medium">{option.value}</span>
              {isSelected && <Check className="w-4 h-4 ml-1" />}
            </motion.button>
          );
        })}
      </div>

      {/* Selection counter */}
      <AnimatePresence>
        {selectedOptions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center pt-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Check className="w-4 h-4" />
              {selectedOptions.length} seleccionada{selectedOptions.length > 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingLookingForSelector;
