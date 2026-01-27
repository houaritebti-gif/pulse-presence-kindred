import { useState, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { GENDERS_MAIN, GENDERS_EXTENDED, ALL_GENDERS, GenderType } from "@/constants/profileOptions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";

interface OnboardingGenderSelectorProps {
  value: GenderType | null;
  onChange: (value: GenderType) => void;
}

// Sort extended genders alphabetically by label
const SORTED_EXTENDED_GENDERS = [...GENDERS_EXTENDED].sort((a, b) => 
  a.label.localeCompare(b.label, "es")
);

const OnboardingGenderSelector = ({ value, onChange }: OnboardingGenderSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isMainGender = value && GENDERS_MAIN.some(g => g.value === value);
  const selectedExtendedLabel = !isMainGender && value 
    ? ALL_GENDERS.find(g => g.value === value)?.label 
    : null;

  const filteredExtended = useMemo(() => 
    SORTED_EXTENDED_GENDERS.filter(g => 
      g.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  const handleSelect = (genderValue: GenderType) => {
    triggerHaptic("selection");
    onChange(genderValue);
    setOpen(false);
    setSearchQuery("");
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

  return (
    <div className="space-y-4">
      {/* Main 3 gender options as large visual buttons */}
      <div className="grid grid-cols-3 gap-3">
        {GENDERS_MAIN.map((gender, index) => (
          <motion.button
            key={gender.value}
            type="button"
            onClick={() => handleSelect(gender.value)}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative py-5 px-3 rounded-2xl font-body text-sm font-semibold transition-all duration-200",
              "border-2 shadow-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              value === gender.value
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]"
                : "bg-card text-card-foreground border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
            )}
          >
            {value === gender.value && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Check className="w-3 h-3" />
              </motion.div>
            )}
            {gender.label}
          </motion.button>
        ))}
      </div>

      {/* "Otro" dropdown button with search */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-14 rounded-2xl border-2 transition-all duration-200 text-base",
              !isMainGender && value 
                ? "border-primary bg-primary/10 text-foreground font-semibold shadow-md" 
                : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <span className="flex items-center gap-2.5">
              {!isMainGender && value && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                />
              )}
              {!isMainGender && value ? selectedExtendedLabel : "Otra identidad..."}
            </span>
            <ChevronDown className={cn(
              "ml-2 h-5 w-5 shrink-0 transition-transform duration-200 text-muted-foreground",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[calc(100vw-2rem)] max-w-[360px] p-0 bg-popover border-2 border-border shadow-xl z-50" 
          align="center"
          sideOffset={8}
        >
          {/* Search input */}
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar identidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background border-border/60 rounded-xl text-base"
                autoFocus
              />
            </div>
          </div>
          
          {/* Options list */}
          <div className="max-h-[280px] overflow-y-auto p-2 overscroll-contain">
            {filteredExtended.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron opciones
              </p>
            ) : (
              <div className="space-y-1">
                {filteredExtended.map((gender) => (
                  <button
                    key={gender.value}
                    type="button"
                    onClick={() => handleSelect(gender.value)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-xl text-base transition-all duration-150 flex items-center justify-between",
                      "touch-manipulation",
                      value === gender.value
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted active:bg-muted/80 text-foreground"
                    )}
                  >
                    {gender.label}
                    {value === gender.value && (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected indicator */}
      <AnimatePresence>
        {value && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Check className="w-4 h-4" />
              {ALL_GENDERS.find(g => g.value === value)?.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingGenderSelector;
