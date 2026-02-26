import { useState, useMemo } from "react";
import { Search, X, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CULTURAL_INTERESTS_CATEGORIES, CULTURAL_INTERESTS } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingInterestsSelectorProps {
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  maxInterests?: number;
  minInterests?: number;
}

const OnboardingInterestsSelector = ({
  selectedInterests,
  onToggleInterest,
  maxInterests = 10,
  minInterests = 3,
}: OnboardingInterestsSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter interests based on search and category
  const filteredInterests = useMemo(() => {
    let interests = CULTURAL_INTERESTS;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      interests = interests.filter(
        (interest) =>
          interest.value.toLowerCase().includes(query) ||
          interest.emoji.includes(query)
      );
    }

    if (activeCategory) {
      const category = CULTURAL_INTERESTS_CATEGORIES.find(
        (c) => c.name === activeCategory
      );
      if (category) {
        const categoryValues = category.interests.map((i) => i.value);
        interests = interests.filter((i) => categoryValues.includes(i.value));
      }
    }

    return interests;
  }, [searchQuery, activeCategory]);

  const handleToggle = (interest: string) => {
    triggerHaptic("selection");
    onToggleInterest(interest);
  };

  const clearSearch = () => {
    setSearchQuery("");
    triggerHaptic("light");
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

  const hasMinimum = selectedInterests.length >= minInterests;
  const isAtMax = selectedInterests.length >= maxInterests;

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-280px)] overflow-hidden">
      {/* Hint */}
      <motion.div 
        className="flex items-center gap-2 text-muted-foreground mb-3 flex-shrink-0"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm">Elige entre {minInterests} y {maxInterests} intereses</span>
      </motion.div>

      {/* Search input */}
      <motion.div 
        className="relative flex-shrink-0 mb-3"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Buscar intereses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-2xl bg-card border-2 border-border/50 text-base touch-manipulation focus:border-primary/50"
          enterKeyHint="search"
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
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 touch-manipulation rounded-xl"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category filter chips */}
      <motion.div 
        className="flex gap-2 overflow-x-auto pb-3 flex-shrink-0 scrollbar-hide -mx-1 px-1"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => {
            setActiveCategory(null);
            triggerHaptic("light");
          }}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border-2",
            activeCategory === null
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-card-foreground border-border/50 hover:border-primary/40"
          )}
        >
          Todos
        </button>
        {CULTURAL_INTERESTS_CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => {
              setActiveCategory(activeCategory === category.name ? null : category.name);
              triggerHaptic("light");
            }}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 border-2",
              activeCategory === category.name
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-card-foreground border-border/50 hover:border-primary/40"
            )}
          >
            <span>{category.emoji}</span>
            <span className="hidden sm:inline">{category.name}</span>
          </button>
        ))}
      </motion.div>

      {/* Interests grid - scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-20 -mx-1 px-1">
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {filteredInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest.value);
              const isDisabled = !isSelected && isAtMax;
              
              return (
                <motion.button
                  key={interest.value}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => handleToggle(interest.value)}
                  disabled={isDisabled}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm transition-all duration-200 flex items-center gap-1.5 touch-manipulation border",
                    isSelected
                      ? "bg-foreground text-background border-foreground shadow-md"
                      : "bg-background/60 text-foreground border-border hover:border-foreground/40",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span>{interest.emoji}</span>
                  <span className="font-semibold">{interest.value}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {filteredInterests.length === 0 && (
            <div className="w-full py-12 text-center">
              <p className="text-muted-foreground mb-3">No se encontraron intereses</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                  triggerHaptic("light");
                }}
                className="text-primary text-sm font-medium hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky counter at bottom */}
      <div className="sticky bottom-0 left-0 right-0 pt-3 pb-1 bg-gradient-to-t from-background via-background to-transparent flex-shrink-0">
        <div className="flex items-center justify-between bg-card/95 backdrop-blur-sm border-2 border-border/50 rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
              hasMinimum 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {selectedInterests.length}
            </div>
            <span className="text-sm text-muted-foreground">
              de {maxInterests} intereses
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            {!hasMinimum ? (
              <motion.span 
                key="minimum"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs text-destructive font-medium px-3 py-1.5 rounded-full bg-destructive/10"
              >
                Faltan {minInterests - selectedInterests.length}
              </motion.span>
            ) : (
              <motion.span 
                key="complete"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs text-primary font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10"
              >
                <Check className="w-3.5 h-3.5" />
                ¡Perfecto!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingInterestsSelector;
