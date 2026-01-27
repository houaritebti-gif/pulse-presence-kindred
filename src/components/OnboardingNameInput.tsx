import { motion, AnimatePresence } from "framer-motion";
import { User, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OnboardingNameInputProps {
  name: string;
  onNameChange: (name: string) => void;
}

const OnboardingNameInput = ({
  name,
  onNameChange,
}: OnboardingNameInputProps) => {
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

  const isValid = name.trim().length > 0;

  return (
    <motion.div 
      className="space-y-5 w-full max-w-sm mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="relative"
        variants={itemVariants}
      >
        {/* Icon container */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none z-10">
          <User className="w-5 h-5 text-primary" />
        </div>

        {/* Input */}
        <Input
          type="text"
          placeholder="Tu nombre o alias"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={cn(
            "h-16 text-lg pl-[4.5rem] pr-12 text-center rounded-2xl",
            "bg-card border-2 transition-all duration-200",
            "text-card-foreground placeholder:text-muted-foreground/50 font-semibold",
            "focus:border-primary/50 focus:ring-0",
            isValid 
              ? "border-primary/30" 
              : "border-border/40"
          )}
          autoFocus
        />

        {/* Checkmark when valid */}
        <AnimatePresence>
          {isValid && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirmation message */}
      <AnimatePresence>
        {isValid && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Check className="w-4 h-4" />
              ¡Hola, {name.trim()}! 👋
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingNameInput;
