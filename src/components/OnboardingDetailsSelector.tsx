import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { OPTIONAL_DETAILS } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface OptionalDetailState {
  has_tattoos: boolean;
  has_piercings: boolean;
  alternative_aesthetic: boolean;
  colored_hair: boolean;
  shaved_head: boolean;
  vintage_style: boolean;
  gothic_style: boolean;
}

interface OnboardingDetailsSelectorProps {
  details: OptionalDetailState;
  onToggleDetail: (key: keyof OptionalDetailState) => void;
}

const OnboardingDetailsSelector = ({
  details,
  onToggleDetail,
}: OnboardingDetailsSelectorProps) => {
  const handleToggle = (key: keyof OptionalDetailState) => {
    triggerHaptic("selection");
    onToggleDetail(key);
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0, 
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

  const selectedCount = Object.values(details).filter(Boolean).length;

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
        <Sparkles className="w-4 h-4" />
        <span className="text-sm">Comparte lo que quieras (opcional)</span>
      </motion.div>

      {/* Details list */}
      <div className="space-y-2">
        {OPTIONAL_DETAILS.map((detail) => {
          const isSelected = details[detail.key as keyof OptionalDetailState];
          
          return (
            <motion.button
              key={detail.key}
              type="button"
              onClick={() => handleToggle(detail.key as keyof OptionalDetailState)}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full p-4 rounded-2xl text-base transition-all duration-200",
                "flex items-center justify-between touch-manipulation",
                "border-2",
                isSelected
                  ? "bg-accent/80 text-accent-foreground border-accent shadow-sm"
                  : "bg-card text-card-foreground border-border/30 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{detail.emoji}</span>
                <span className="font-medium">{detail.label}</span>
              </span>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Selection counter */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center pt-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground font-medium text-sm">
              <Check className="w-4 h-4" />
              {selectedCount} detalle{selectedCount > 1 ? "s" : ""} compartido{selectedCount > 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingDetailsSelector;
