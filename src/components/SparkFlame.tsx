import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { SparkLevel } from "@/hooks/useSparkEnergy";

interface SparkFlameProps {
  level: SparkLevel;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

// Level configurations
const LEVEL_CONFIG: Record<SparkLevel, {
  name: string;
  emoji: string;
  colors: string[];
  glowColor: string;
  intensity: number;
}> = {
  1: {
    name: "Brasas",
    emoji: "🪨",
    colors: ["#4A4A4A", "#6B6B6B", "#8B4513"],
    glowColor: "rgba(139, 69, 19, 0.3)",
    intensity: 0.3,
  },
  2: {
    name: "Llama",
    emoji: "🕯️",
    colors: ["#FF6B35", "#FF8C42", "#FFB347"],
    glowColor: "rgba(255, 140, 66, 0.4)",
    intensity: 0.5,
  },
  3: {
    name: "Fuego",
    emoji: "🔥",
    colors: ["#E63946", "#FF6B6B", "#FFA07A"],
    glowColor: "rgba(230, 57, 70, 0.5)",
    intensity: 0.7,
  },
  4: {
    name: "Hoguera",
    emoji: "🏕️",
    colors: ["#E63946", "#FF4500", "#FFD700"],
    glowColor: "rgba(255, 69, 0, 0.6)",
    intensity: 0.85,
  },
  5: {
    name: "Radiante",
    emoji: "💫",
    colors: ["#FFD700", "#FFF8DC", "#FFFFFF"],
    glowColor: "rgba(255, 215, 0, 0.7)",
    intensity: 1,
  },
};

const SIZE_CONFIG = {
  sm: { container: 40, flame: 24, label: "text-xs" },
  md: { container: 56, flame: 36, label: "text-sm" },
  lg: { container: 80, flame: 52, label: "text-base" },
  xl: { container: 120, flame: 80, label: "text-lg" },
};

// Flame path SVG
const FlamePath = ({ colors, intensity }: { colors: string[]; intensity: number }) => {
  const gradientId = `flame-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="50%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
        <filter id="flame-blur">
          <feGaussianBlur stdDeviation={1.5 * intensity} />
        </filter>
      </defs>
      
      {/* Main flame body */}
      <motion.path
        d="M50 5 
           C60 25, 85 35, 80 60 
           C78 75, 70 85, 65 95 
           C60 105, 55 110, 50 115 
           C45 110, 40 105, 35 95 
           C30 85, 22 75, 20 60 
           C15 35, 40 25, 50 5 Z"
        fill={`url(#${gradientId})`}
        style={{ filter: "url(#flame-blur)" }}
      />
      
      {/* Inner flame */}
      <motion.path
        d="M50 30 
           C55 40, 65 50, 62 65 
           C60 75, 55 85, 50 95 
           C45 85, 40 75, 38 65 
           C35 50, 45 40, 50 30 Z"
        fill={colors[2]}
        opacity={0.7 + (intensity * 0.3)}
        style={{ filter: "url(#flame-blur)" }}
      />
      
      {/* Core (brightest) */}
      {intensity > 0.5 && (
        <motion.ellipse
          cx="50"
          cy="75"
          rx={8 + intensity * 4}
          ry={15 + intensity * 5}
          fill={intensity > 0.8 ? "#FFFFFF" : colors[2]}
          opacity={0.5 + intensity * 0.3}
        />
      )}
    </svg>
  );
};

// Animated particles for higher levels
const FlameParticles = ({ level, size }: { level: SparkLevel; size: number }) => {
  if (level < 3) return null;
  
  const particleCount = level === 3 ? 3 : level === 4 ? 5 : 8;
  const config = LEVEL_CONFIG[level];
  
  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 3,
            height: 3 + Math.random() * 3,
            backgroundColor: config.colors[Math.floor(Math.random() * config.colors.length)],
            left: `${30 + Math.random() * 40}%`,
            bottom: "20%",
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: [0, -size * 0.8],
            opacity: [1, 0],
            scale: [1, 0.5],
            x: [0, (Math.random() - 0.5) * 20],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
};

// Main flame animation variants
const flameVariants: Variants = {
  idle: {
    scale: [1, 1.02, 0.98, 1],
    rotate: [0, -1, 1, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  pulse: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  intense: {
    scale: [1, 1.05, 0.95, 1.03, 1],
    rotate: [0, -2, 2, -1, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Glow animation
const glowVariants: Variants = {
  idle: {
    opacity: [0.5, 0.7, 0.5],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  intense: {
    opacity: [0.6, 0.9, 0.6],
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
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
  
  const getAnimationVariant = () => {
    if (!animate) return undefined;
    if (level >= 4) return "intense";
    if (level >= 2) return "pulse";
    return "idle";
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: sizeConfig.container, 
          height: sizeConfig.container 
        }}
      >
        {/* Glow effect */}
        {animate && level >= 2 && (
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ backgroundColor: config.glowColor }}
            variants={glowVariants}
            animate={level >= 4 ? "intense" : "idle"}
          />
        )}
        
        {/* Main flame container */}
        <motion.div
          className="relative z-10"
          style={{ 
            width: sizeConfig.flame, 
            height: sizeConfig.flame * 1.2 
          }}
          variants={flameVariants}
          animate={getAnimationVariant()}
        >
          <FlamePath colors={config.colors} intensity={config.intensity} />
          
          {/* Particles */}
          {animate && (
            <FlameParticles level={level} size={sizeConfig.flame} />
          )}
        </motion.div>
        
        {/* Ember base for level 1 */}
        {level === 1 && (
          <motion.div
            className="absolute bottom-1 w-2/3 h-2 rounded-full bg-gradient-to-t from-amber-900/50 to-orange-600/30"
            animate={animate ? {
              opacity: [0.5, 0.8, 0.5],
            } : undefined}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        
        {/* Radiating rings for max level */}
        {level === 5 && animate && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-yellow-300/30"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </div>
      
      {showLabel && (
        <div className={cn("flex items-center gap-1 font-medium", sizeConfig.label)}>
          <span>{config.emoji}</span>
          <span className="text-foreground">{config.name}</span>
        </div>
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
        "flex items-center gap-1 px-2 py-1 rounded-full",
        "bg-gradient-to-r from-primary/10 to-primary/5",
        "border border-primary/20 hover:border-primary/40",
        "transition-colors duration-200",
        "min-w-0 flex-shrink-0", // Prevent clipping
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Simplified flame icon for compact view */}
      <div 
        className="w-5 h-5 flex items-center justify-center flex-shrink-0"
        style={{ 
          background: `linear-gradient(135deg, ${config.colors[0]}, ${config.colors[1]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        <span className="text-sm">🔥</span>
      </div>
      <span className="text-xs font-bold text-foreground tabular-nums">{energy}</span>
    </motion.button>
  );
}

export default SparkFlame;
