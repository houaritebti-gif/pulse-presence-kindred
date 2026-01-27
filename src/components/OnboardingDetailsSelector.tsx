import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { OPTIONAL_DETAILS, OPTIONAL_DETAIL_CATEGORIES, getOptionalDetailsByCategory } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface OnboardingDetailsSelectorProps {
  details: Record<string, boolean>;
  onToggleDetail: (key: string) => void;
}

const OnboardingDetailsSelector = ({
  details,
  onToggleDetail,
}: OnboardingDetailsSelectorProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["aesthetic"]);

  const handleToggle = (key: string) => {
    triggerHaptic("selection");
    onToggleDetail(key);
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryKey) 
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    );
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
        staggerChildren: 0.03,
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
        <span className="text-sm">Comparte lo que quieras (todo es opcional)</span>
      </motion.div>

      {/* Categories accordion */}
      <div className="space-y-3">
        {OPTIONAL_DETAIL_CATEGORIES.map((category) => {
          const categoryDetails = getOptionalDetailsByCategory(category.key);
          const isExpanded = expandedCategories.includes(category.key);
          const selectedInCategory = categoryDetails.filter(d => details[d.key]).length;
          
          return (
            <motion.div
              key={category.key}
              variants={itemVariants}
              className="border border-border/30 rounded-2xl overflow-hidden bg-card/50"
            >
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.key)}
                className={cn(
                  "w-full p-4 flex items-center justify-between touch-manipulation",
                  "transition-colors duration-200",
                  isExpanded ? "bg-primary/5" : "hover:bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.emoji}</span>
                  <span className="font-semibold text-foreground">{category.label}</span>
                  {selectedInCategory > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {selectedInCategory}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Category items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 space-y-2">
                      {categoryDetails.map((detail) => {
                        const isSelected = details[detail.key];
                        
                        return (
                          <motion.button
                            key={detail.key}
                            type="button"
                            onClick={() => handleToggle(detail.key)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                              "w-full p-3 rounded-xl text-sm transition-all duration-200",
                              "flex items-center justify-between touch-manipulation",
                              "border",
                              isSelected
                                ? "bg-accent/80 text-accent-foreground border-accent shadow-sm"
                                : "bg-background text-foreground border-border/30 hover:border-primary/30 hover:bg-primary/5"
                            )}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-lg">{detail.emoji}</span>
                              <span className="font-medium">{detail.label}</span>
                            </span>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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