import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SparkLevel } from "@/hooks/useSparkEnergy";

interface SparkFlameProps {
  level: SparkLevel;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

// Level configurations with brand-consistent colors
const LEVEL_CONFIG: Record<SparkLevel, {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  glowColor: string;
  intensity: number;
}> = {
  1: {
    name: "Chispita",
    emoji: "✨",
    color: "hsl(var(--muted-foreground))",
    bgColor: "hsl(var(--muted))",
    glowColor: "hsl(var(--muted-foreground) / 0.2)",
    intensity: 0.3,
  },
  2: {
    name: "Llama",
    emoji: "⚡",
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.15)",
    glowColor: "hsl(var(--primary) / 0.3)",
    intensity: 0.5,
  },
  3: {
    name: "Fuego",
    emoji: "⚡",
    color: "hsl(var(--secondary))",
    bgColor: "hsl(var(--secondary) / 0.15)",
    glowColor: "hsl(var(--secondary) / 0.3)",
    intensity: 0.7,
  },
  4: {
    name: "Hoguera",
    emoji: "⚡",
    color: "hsl(var(--secondary))",
    bgColor: "hsl(var(--secondary) / 0.2)",
    glowColor: "hsl(var(--secondary) / 0.4)",
    intensity: 0.85,
  },
  5: {
    name: "Radiante",
    emoji: "💫",
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.2)",
    glowColor: "hsl(var(--primary) / 0.5)",
    intensity: 1,
  },
};

const SIZE_CONFIG = {
  sm: { container: 48, icon: 20, label: "text-xs" },
  md: { container: 72, icon: 32, label: "text-sm" },
  lg: { container: 100, icon: 44, label: "text-base" },
  xl: { container: 140, icon: 60, label: "text-lg" },
};

export function SparkFlame({ 
  level, 
  size = "md", 
  showLabel = false,
  animate = true,
  className 
}: SparkFlameProps) {
  const config = LEVEL_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div 
        className="relative flex items-center justify-center rounded-full"
        style={{ 
          width: sizeConfig.container, 
          height: sizeConfig.container,
          backgroundColor: config.bgColor,
        }}
      >
        {/* Glow ring for higher levels */}
        {animate && level >= 2 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ 
              boxShadow: `0 0 ${12 + level * 6}px ${config.glowColor}`,
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Pulse rings for max level */}
        {level === 5 && animate && (
          <>
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: config.color }}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: [0.9, 1.6], opacity: [0.5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}

        {/* Zap icon */}
        <motion.div
          className="relative z-10"
          animate={animate ? {
            scale: [1, 1.05, 1],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Zap 
            style={{ 
              width: sizeConfig.icon, 
              height: sizeConfig.icon,
              color: config.color,
              fill: config.color,
            }}
          />
        </motion.div>
      </div>
      
      {showLabel && (
        <motion.div 
          className={cn("flex items-center gap-1.5 font-semibold", sizeConfig.label)}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-lg">{config.emoji}</span>
          <span className="text-foreground">{config.name}</span>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for nav/headers
export function SparkFlameCompact({ 
  level, 
  energy,
  onClick,
  className 
}: { 
  level: SparkLevel; 
  energy: number;
  onClick?: () => void;
  className?: string;
}) {
  const config = LEVEL_CONFIG[level];
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
        "border border-primary/30 hover:border-primary/50",
        "transition-all duration-300",
        "min-w-0 flex-shrink-0 overflow-hidden",
        className
      )}
      style={{
        backgroundColor: config.bgColor,
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <Zap 
        className="relative w-4 h-4 flex-shrink-0" 
        style={{ color: config.color, fill: config.color }}
      />
      <span 
        className="relative text-sm font-bold tabular-nums"
        style={{ color: config.color }}
      >
        {energy}
      </span>
    </motion.button>
  );
}

// Export config for use in other components
export { LEVEL_CONFIG };

export default SparkFlame;
