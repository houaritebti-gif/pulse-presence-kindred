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
    <div className="space-y-5">
      {/* City input - main field */}
      <motion.div 
        className="relative"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <Input
          type="text"
          placeholder="Tu ciudad"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="h-16 text-lg pl-[4.5rem] pr-4 text-center rounded-2xl bg-card border-2 border-card-foreground/20 text-card-foreground placeholder:text-card-foreground/50 focus:border-primary/50 transition-all font-medium"
          autoFocus
        />
      </motion.div>

      {/* Zone input - optional secondary field */}
      <motion.div 
        className="relative"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center pointer-events-none">
          <Navigation className="w-4 h-4 text-accent-foreground/70" />
        </div>
        <Input
          type="text"
          placeholder="Barrio o zona (opcional)"
          value={zone}
          onChange={(e) => onZoneChange(e.target.value)}
          className="h-14 text-base pl-[4.5rem] pr-4 text-center rounded-2xl bg-card/60 border border-border/40 text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-card transition-all"
        />
      </motion.div>

      {/* Helper text */}
      <motion.p 
        className="text-center text-xs text-muted-foreground/80"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        El barrio ayuda a encontrar gente más cercana
      </motion.p>
    </div>
  );
};

export default OnboardingCitySelector;
