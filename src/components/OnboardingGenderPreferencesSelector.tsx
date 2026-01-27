import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Search, X } from "lucide-react";
import { GenderType, ALL_GENDERS } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OnboardingGenderPreferencesSelectorProps {
  selectedPreferences: GenderType[];
  onTogglePreference: (preference: GenderType) => void;
}

// Main preference options shown as large buttons
const MAIN_PREFERENCES: Array<{ value: GenderType; label: string; emoji: string }> = [
  { value: "woman", label: "Mujeres", emoji: "👩" },
  { value: "man", label: "Hombres", emoji: "👨" },
  { value: "non_binary", label: "No binarias", emoji: "🌈" },
];

// Sort all genders alphabetically (excluding main ones for the extended list)
const EXTENDED_PREFERENCES = ALL_GENDERS
  .filter(g => !MAIN_PREFERENCES.some(m => m.value === g.value))
  .sort((a, b) => a.label.localeCompare(b.label, "es"));

const OnboardingGenderPreferencesSelector = ({
  selectedPreferences,
  onTogglePreference,
}: OnboardingGenderPreferencesSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showExtended, setShowExtended] = useState(false);

  const filteredExtended = useMemo(() => 
    EXTENDED_PREFERENCES.filter(g => 
      g.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  const handleToggle = (preference: GenderType) => {
    triggerHaptic("selection");
    onTogglePreference(preference);
  };

  const clearSearch = () => {
    setSearchQuery("");
    triggerHaptic("light");
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

  // Check if any extended preference is selected
  const hasExtendedSelection = selectedPreferences.some(
    pref => EXTENDED_PREFERENCES.some(ext => ext.value === pref)
  );

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

      {/* Main 3 options */}
      <div className="space-y-3">
        {MAIN_PREFERENCES.map((option) => {
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
                "w-full p-4 rounded-2xl text-base transition-all duration-200",
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

      {/* Expandable extended options */}
      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={() => {
            setShowExtended(!showExtended);
            triggerHaptic("light");
          }}
          className={cn(
            "w-full p-4 rounded-2xl text-base transition-all duration-200",
            "flex items-center justify-between touch-manipulation",
            "border-2",
            showExtended || hasExtendedSelection
              ? "border-primary/50 bg-primary/5"
              : "border-border/40 hover:border-primary/40"
          )}
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <span className="font-medium text-foreground">
              {hasExtendedSelection 
                ? `${selectedPreferences.filter(p => EXTENDED_PREFERENCES.some(e => e.value === p)).length} más seleccionadas`
                : "Más identidades..."}
            </span>
          </span>
          <motion.span
            animate={{ rotate: showExtended ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {showExtended && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar identidades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-card border-2 border-border/50 text-base"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                          onClick={clearSearch}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Extended options list */}
                <div className="max-h-[200px] overflow-y-auto overscroll-contain space-y-1 scrollbar-hide">
                  {filteredExtended.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No se encontraron identidades
                    </p>
                  ) : (
                    filteredExtended.map((option) => {
                      const isSelected = selectedPreferences.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleToggle(option.value)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-150",
                            "flex items-center justify-between touch-manipulation",
                            isSelected
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-muted active:bg-muted/80 text-foreground"
                          )}
                        >
                          {option.label}
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
