import { motion, AnimatePresence } from "framer-motion";
import { Music, Check } from "lucide-react";
import { MUSIC_STYLES } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingMusicSelectorProps {
  selectedStyles: string[];
  onToggleStyle: (style: string) => void;
  maxStyles?: number;
}

const OnboardingMusicSelector = ({
  selectedStyles,
  onToggleStyle,
  maxStyles = 3,
}: OnboardingMusicSelectorProps) => {
  const handleToggle = (style: string) => {
    if (!selectedStyles.includes(style) && selectedStyles.length >= maxStyles) {
      toast.error(`Máximo ${maxStyles} estilos`);
      return;
    }
    triggerHaptic("selection");
    onToggleStyle(style);
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
        <Music className="w-4 h-4" />
        <span className="text-sm">Elige hasta {maxStyles} estilos (opcional)</span>
      </motion.div>

      {/* Music styles as cards */}
      <div className="grid grid-cols-2 gap-3">
        {MUSIC_STYLES.map((style) => {
          const isSelected = selectedStyles.includes(style.value);
          const isDisabled = !isSelected && selectedStyles.length >= maxStyles;

          return (
            <motion.button
              key={style.value}
              type="button"
              onClick={() => handleToggle(style.value)}
              disabled={isDisabled}
              variants={itemVariants}
              whileHover={{ scale: isDisabled ? 1 : 1.03 }}
              whileTap={{ scale: isDisabled ? 1 : 0.97 }}
              className={cn(
                "relative p-4 rounded-2xl text-sm transition-all duration-200",
                "flex flex-col items-center justify-center gap-2 min-h-[90px]",
                "border-2 touch-manipulation",
                isSelected
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/25"
                  : "bg-card text-card-foreground border-border/40 hover:border-primary/40 hover:bg-primary/5",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
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

              <span className="text-2xl">{style.emoji}</span>
              <span className="font-semibold text-xs text-center leading-tight">{style.value}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Counter */}
      <AnimatePresence>
        {selectedStyles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center pt-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Music className="w-4 h-4" />
              {selectedStyles.length}/{maxStyles} estilos
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingMusicSelector;
