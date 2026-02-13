import { useState, useMemo } from "react";
import { Search, X, Star, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CULTURAL_INTERESTS_CATEGORIES, CULTURAL_INTERESTS } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InterestsSelectorProps {
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  maxInterests?: number;
  minInterests?: number;
  showCounter?: boolean;
  variant?: "onboarding" | "profile";
}

export const InterestsSelector = ({
  selectedInterests,
  onToggleInterest,
  maxInterests = 10,
  minInterests = 3,
  showCounter = true,
  variant = "profile",
}: InterestsSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter interests based on search and category
  const filteredInterests = useMemo(() => {
    let interests = CULTURAL_INTERESTS;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      interests = interests.filter(
        (interest) =>
          interest.value.toLowerCase().includes(query) ||
          interest.emoji.includes(query)
      );
    }

    // Filter by category
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
  };

  const isOnboarding = variant === "onboarding";

  return (
    <div className={cn(
      "space-y-4", 
      isOnboarding && "max-h-[50vh] overflow-hidden flex flex-col"
    )}>
      {/* Search input - sticky at top */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Buscar intereses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-12 rounded-xl bg-card border-border/50 text-base touch-manipulation"
          enterKeyHint="search"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 touch-manipulation"
            onClick={clearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0 scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
            activeCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Todos
        </button>
        {CULTURAL_INTERESTS_CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() =>
              setActiveCategory(
                activeCategory === category.name ? null : category.name
              )
            }
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1",
              activeCategory === category.name
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <span>{category.emoji}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Interests grid - scrollable with improved touch handling */}
      <div className={cn(
        "flex flex-wrap gap-2",
        isOnboarding ? "overflow-y-auto flex-1 pb-16 overscroll-contain" : ""
      )}>
        <AnimatePresence mode="popLayout">
          {filteredInterests.map((interest) => (
            <motion.button
              key={interest.value}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleToggle(interest.value)}
              disabled={
                !selectedInterests.includes(interest.value) &&
                selectedInterests.length >= maxInterests
              }
              className={cn(
                "px-4 py-2.5 rounded-full text-base transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95",
                selectedInterests.includes(interest.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground hover:bg-card/80 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <span>{interest.emoji}</span>
              <span>{interest.value}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        {filteredInterests.length === 0 && (
          <div className="w-full py-8 text-center text-muted-foreground">
            <p className="text-sm">No se encontraron intereses</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(null);
              }}
              className="text-primary text-sm mt-2 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Counter - sticky at bottom with improved visibility */}
      {showCounter && (
        <div className={cn(
          "pt-3 bg-background/95 backdrop-blur-sm border-t border-border/50 flex-shrink-0",
          isOnboarding && "sticky bottom-0 -mx-1 px-1"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span
                className={cn(
                  "text-sm font-medium",
                  selectedInterests.length >= minInterests
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {selectedInterests.length}/{maxInterests} intereses
              </span>
            </div>
            {selectedInterests.length < minInterests && (
              <span className="text-xs text-destructive font-medium px-2 py-1 rounded-full bg-destructive/10">
                Mínimo {minInterests}
              </span>
            )}
            {selectedInterests.length >= minInterests && (
              <span className="text-xs text-primary font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Mínimo alcanzado
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestsSelector;
