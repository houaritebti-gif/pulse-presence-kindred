import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart } from "lucide-react";
import { GenderType, GENDERS_MAIN } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface OnboardingGenderPreferencesSelectorProps {
  selectedPreferences: GenderType[];
  onTogglePreference: (preference: GenderType) => void;
}

const PREFERENCE_OPTIONS = [
  { value: "woman" as GenderType, label: "Mujeres", emoji: "👩" },
  { value: "man" as GenderType, label: "Hombres", emoji: "👨" },
  { value: "non_binary" as GenderType, label: "Personas no binarias", emoji: "🌈" },
];

const OnboardingGenderPreferencesSelector = ({
  selectedPreferences,
  onTogglePreference,
}: OnboardingGenderPreferencesSelectorProps) => {
  const handleToggle = (preference: GenderType) => {
    triggerHaptic("selection");
    onTogglePreference(preference);
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
        staggerChildren: 0.08,
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
        <Heart className="w-4 h-4" />
        <span className="text-sm">Puedes elegir varias opciones</span>
      </motion.div>

      {/* Options */}
      <div className="space-y-3">
        {PREFERENCE_OPTIONS.map((option, index) => {
          const isSelected = selectedPreferences.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full p-5 rounded-2xl text-base transition-all duration-200",
                "flex items-center justify-between touch-manipulation",
                "border-2",
                isSelected
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card text-card-foreground border-border/40 hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-semibold">{option.label}</span>
              </span>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Selection counter */}
      <AnimatePresence>
        {selectedPreferences.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center pt-3"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Check className="w-4 h-4" />
              {selectedPreferences.length} seleccionada{selectedPreferences.length > 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingGenderPreferencesSelector;
