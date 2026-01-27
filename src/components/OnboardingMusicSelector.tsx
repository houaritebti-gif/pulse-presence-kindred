import { motion, AnimatePresence } from "framer-motion";
import { Music, Check } from "lucide-react";
import { MUSIC_CATEGORIES } from "@/constants/profileOptions";
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
  maxStyles = 5,
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
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "tween" as const,
        duration: 0.15,
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
      className="space-y-5 max-h-[50vh] overflow-y-auto overscroll-contain scrollbar-hide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {MUSIC_CATEGORIES.map((category, categoryIndex) => (
        <motion.div 
          key={category.name}
          variants={itemVariants}
          className="space-y-2.5"
        >
          {/* Category header */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Music className="w-3.5 h-3.5" />
            <h3 
              className="text-xs font-bold uppercase tracking-wide"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              {category.name}
            </h3>
          </div>

          {/* Styles chips */}
          <div className="flex flex-wrap gap-2">
            {category.styles.map((style) => {
              const isSelected = selectedStyles.includes(style);
              const isDisabled = !isSelected && selectedStyles.length >= maxStyles;
              
              return (
                <motion.button
                  key={style}
                  type="button"
                  onClick={() => handleToggle(style)}
                  disabled={isDisabled}
                  whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                  whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all duration-150",
                    "flex items-center gap-1 touch-manipulation",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-card text-card-foreground hover:bg-card/80 border border-border/30",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {style}
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Sticky counter */}
      <AnimatePresence>
        {selectedStyles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-3 border-t border-border/50"
          >
            <div className="flex items-center justify-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <span className={cn(
                "text-sm font-medium",
                selectedStyles.length >= maxStyles ? "text-primary" : "text-foreground"
              )}>
                {selectedStyles.length}/{maxStyles} estilos
              </span>
              {selectedStyles.length >= maxStyles && (
                <span className="text-xs text-primary/70">(máximo alcanzado)</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingMusicSelector;
