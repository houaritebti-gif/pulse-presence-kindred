import { MapPin, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface OnboardingCitySelectorProps {
  city: string;
  zone: string;
  onCityChange: (city: string) => void;
  onZoneChange: (zone: string) => void;
}

const OnboardingCitySelector = ({
  city,
  zone,
  onCityChange,
  onZoneChange,
}: OnboardingCitySelectorProps) => {
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

  return (
    <motion.div 
      className="space-y-5 w-full max-w-sm mx-auto"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      {/* City input - main field */}
      <motion.div 
        className="relative"
        variants={itemVariants}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none z-10">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <Input
          type="text"
          placeholder="Tu ciudad"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="h-16 text-lg pl-[4.5rem] pr-4 text-center rounded-2xl bg-card border-2 border-primary/30 text-card-foreground placeholder:text-card-foreground/50 focus:border-primary/60 transition-all font-semibold shadow-sm"
          autoFocus
        />
      </motion.div>

      {/* Zone input - optional secondary field */}
      <motion.div 
        className="relative"
        variants={itemVariants}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center pointer-events-none z-10">
          <Navigation className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Barrio o zona (opcional)"
          value={zone}
          onChange={(e) => onZoneChange(e.target.value)}
          className="h-14 text-base pl-[4.5rem] pr-4 text-center rounded-2xl bg-muted/30 border border-border/50 text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-card transition-all"
        />
      </motion.div>

      {/* Helper text with icon */}
      <motion.div 
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80"
        variants={itemVariants}
      >
        <div className="w-1 h-1 rounded-full bg-primary/50" />
        <span>El barrio ayuda a encontrar gente más cercana</span>
        <div className="w-1 h-1 rounded-full bg-primary/50" />
      </motion.div>
    </motion.div>
  );
};

export default OnboardingCitySelector;
