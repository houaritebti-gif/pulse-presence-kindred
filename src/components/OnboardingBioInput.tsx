import { motion, AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface OnboardingBioInputProps {
  bio: string;
  onBioChange: (bio: string) => void;
  maxLength?: number;
}

const OnboardingBioInput = ({
  bio,
  onBioChange,
  maxLength = 300,
}: OnboardingBioInputProps) => {
  const handleChange = (value: string) => {
    onBioChange(value.slice(0, maxLength));
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
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const charCount = bio.length;
  const isNearLimit = charCount >= maxLength * 0.9;
  const isAtLimit = charCount >= maxLength;

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hint */}
      <motion.div 
        className="flex items-center gap-2 text-muted-foreground"
        variants={itemVariants}
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm">Cuéntanos algo sobre ti (opcional)</span>
      </motion.div>

      {/* Textarea with enhanced styling */}
      <motion.div variants={itemVariants} className="relative">
        <Textarea
          placeholder="Me encanta la música indie y los cafés con encanto. Busco gente con quien compartir conciertos y paseos por la ciudad..."
          value={bio}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "min-h-[140px] resize-none text-base rounded-2xl",
            "bg-card border-2 transition-all duration-200",
            "text-card-foreground placeholder:text-muted-foreground/50",
            "focus:border-primary/50 focus:ring-0",
            bio.length > 0 
              ? "border-primary/30" 
              : "border-border/40"
          )}
          maxLength={maxLength}
        />
        
        {/* Character counter */}
        <div className="flex justify-between items-center mt-2 px-1">
          <div className="flex gap-1">
            {bio.length > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-primary/70"
              >
                ✓ Bio añadida
              </motion.span>
            )}
          </div>
          <span 
            className={cn(
              "text-xs font-medium transition-colors",
              isAtLimit 
                ? "text-destructive" 
                : isNearLimit 
                  ? "text-amber-500" 
                  : "text-muted-foreground"
            )}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      </motion.div>

      {/* Writing tips */}
      <AnimatePresence>
        {bio.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground">
                💡 <span className="font-medium">Tips:</span> Menciona tus hobbies, 
                qué tipo de personas buscas conocer, o qué te hace único/a.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingBioInput;
