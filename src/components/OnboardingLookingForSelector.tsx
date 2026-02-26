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
        <span className="text-sm">Selecciona hasta 4 opciones</span>
      </motion.div>

      {/* Options grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {LOOKING_FOR_OPTIONS.map((option) => {
          const isSelected = selectedOptions.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm transition-all duration-200",
                "flex items-center gap-1.5 touch-manipulation border",
                isSelected
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-background/60 text-foreground border-border hover:border-foreground/40"
              )}
            >
              <span>{option.emoji}</span>
              <span className="font-semibold">{option.value}</span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
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
