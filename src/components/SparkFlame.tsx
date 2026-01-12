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

// Level configurations with enhanced 3D colors
const LEVEL_CONFIG: Record<SparkLevel, {
  name: string;
  emoji: string;
  colors: {
    outer: string;
    middle: string;
    inner: string;
    core: string;
    highlight: string;
  };
  glowColor: string;
  intensity: number;
}> = {
  1: {
    name: "Chispita",
    emoji: "✨",
    colors: {
      outer: "#3D2914",
      middle: "#5C3D1E",
      inner: "#8B4513",
      core: "#CD853F",
      highlight: "#DEB887",
    },
    glowColor: "rgba(139, 69, 19, 0.4)",
    intensity: 0.3,
  },
  2: {
    name: "Llama",
    emoji: "🕯️",
    colors: {
      outer: "#CC4400",
      middle: "#FF6B35",
      inner: "#FF8C42",
      core: "#FFAA5E",
      highlight: "#FFD4A8",
    },
    glowColor: "rgba(255, 107, 53, 0.5)",
    intensity: 0.5,
  },
  3: {
    name: "Fuego",
    emoji: "🔥",
    colors: {
      outer: "#B8001F",
      middle: "#E63946",
      inner: "#FF6B6B",
      core: "#FFA07A",
      highlight: "#FFDAB9",
    },
    glowColor: "rgba(230, 57, 70, 0.6)",
    intensity: 0.7,
  },
  4: {
    name: "Hoguera",
    emoji: "🏕️",
    colors: {
      outer: "#CC2200",
      middle: "#FF4500",
      inner: "#FF6B00",
      core: "#FFD700",
      highlight: "#FFFACD",
    },
    glowColor: "rgba(255, 69, 0, 0.7)",
    intensity: 0.85,
  },
  5: {
    name: "Radiante",
    emoji: "💫",
    colors: {
      outer: "#FF8C00",
      middle: "#FFD700",
      inner: "#FFF8DC",
      core: "#FFFFFF",
      highlight: "#FFFFFF",
    },
    glowColor: "rgba(255, 215, 0, 0.8)",
    intensity: 1,
  },
};

const SIZE_CONFIG = {
  sm: { container: 48, flame: 32, label: "text-xs" },
  md: { container: 72, flame: 48, label: "text-sm" },
  lg: { container: 100, flame: 68, label: "text-base" },
  xl: { container: 140, flame: 96, label: "text-lg" },
};

// Enhanced 3D Flame SVG with multiple layers
const Flame3D = ({ colors, intensity, id }: { 
  colors: typeof LEVEL_CONFIG[1]['colors']; 
  intensity: number;
  id: string;
}) => {
  return (
    <svg viewBox="0 0 100 130" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
      <defs>
        {/* Outer flame gradient */}
        <radialGradient id={`${id}-outer`} cx="50%" cy="80%" r="60%" fx="50%" fy="90%">
          <stop offset="0%" stopColor={colors.middle} />
          <stop offset="60%" stopColor={colors.outer} />
          <stop offset="100%" stopColor={colors.outer} stopOpacity="0.8" />
        </radialGradient>
        
        {/* Middle flame gradient */}
        <radialGradient id={`${id}-middle`} cx="50%" cy="70%" r="50%" fx="50%" fy="80%">
          <stop offset="0%" stopColor={colors.inner} />
          <stop offset="70%" stopColor={colors.middle} />
          <stop offset="100%" stopColor={colors.middle} stopOpacity="0.6" />
        </radialGradient>
        
        {/* Inner flame gradient */}
        <radialGradient id={`${id}-inner`} cx="50%" cy="65%" r="40%" fx="50%" fy="75%">
          <stop offset="0%" stopColor={colors.core} />
          <stop offset="60%" stopColor={colors.inner} />
          <stop offset="100%" stopColor={colors.inner} stopOpacity="0.4" />
        </radialGradient>
        
        {/* Core gradient */}
        <radialGradient id={`${id}-core`} cx="50%" cy="60%" r="30%" fx="50%" fy="70%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="50%" stopColor={colors.core} />
          <stop offset="100%" stopColor={colors.core} stopOpacity="0.2" />
        </radialGradient>
        
        {/* Highlight shine */}
        <linearGradient id={`${id}-shine`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3 * intensity} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Inner glow */}
        <filter id={`${id}-inner-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer flame layer - largest */}
      <motion.path
        d="M50 8 
           C65 20, 92 40, 88 70 
           C85 90, 75 105, 65 115 
           C58 122, 52 125, 50 125 
           C48 125, 42 122, 35 115 
           C25 105, 15 90, 12 70 
           C8 40, 35 20, 50 8 Z"
        fill={`url(#${id}-outer)`}
        filter={`url(#${id}-glow)`}
        animate={{
          d: [
            "M50 8 C65 20, 92 40, 88 70 C85 90, 75 105, 65 115 C58 122, 52 125, 50 125 C48 125, 42 122, 35 115 C25 105, 15 90, 12 70 C8 40, 35 20, 50 8 Z",
            "M50 5 C68 22, 90 42, 86 68 C83 88, 73 103, 63 113 C56 120, 52 123, 50 123 C48 123, 44 120, 37 113 C27 103, 17 88, 14 68 C10 42, 32 22, 50 5 Z",
            "M50 10 C63 18, 88 38, 85 72 C82 92, 72 107, 62 117 C55 124, 52 127, 50 127 C48 127, 45 124, 38 117 C28 107, 18 92, 15 72 C12 38, 37 18, 50 10 Z",
            "M50 8 C65 20, 92 40, 88 70 C85 90, 75 105, 65 115 C58 122, 52 125, 50 125 C48 125, 42 122, 35 115 C25 105, 15 90, 12 70 C8 40, 35 20, 50 8 Z",
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Middle flame layer */}
      <motion.path
        d="M50 22 
           C60 32, 78 48, 75 72 
           C73 88, 65 100, 58 108 
           C54 112, 52 114, 50 114 
           C48 114, 46 112, 42 108 
           C35 100, 27 88, 25 72 
           C22 48, 40 32, 50 22 Z"
        fill={`url(#${id}-middle)`}
        animate={{
          d: [
            "M50 22 C60 32, 78 48, 75 72 C73 88, 65 100, 58 108 C54 112, 52 114, 50 114 C48 114, 46 112, 42 108 C35 100, 27 88, 25 72 C22 48, 40 32, 50 22 Z",
            "M50 18 C62 30, 76 46, 73 70 C71 86, 63 98, 56 106 C52 110, 51 112, 50 112 C49 112, 48 110, 44 106 C37 98, 29 86, 27 70 C24 46, 38 30, 50 18 Z",
            "M50 25 C58 34, 74 50, 71 74 C69 90, 61 102, 54 110 C51 114, 51 116, 50 116 C49 116, 49 114, 46 110 C39 102, 31 90, 29 74 C26 50, 42 34, 50 25 Z",
            "M50 22 C60 32, 78 48, 75 72 C73 88, 65 100, 58 108 C54 112, 52 114, 50 114 C48 114, 46 112, 42 108 C35 100, 27 88, 25 72 C22 48, 40 32, 50 22 Z",
          ]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1,
        }}
      />
      
      {/* Inner flame layer */}
      <motion.path
        d="M50 35 
           C56 42, 68 55, 65 75 
           C63 88, 58 96, 54 102 
           C52 105, 51 106, 50 106 
           C49 106, 48 105, 46 102 
           C42 96, 37 88, 35 75 
           C32 55, 44 42, 50 35 Z"
        fill={`url(#${id}-inner)`}
        filter={`url(#${id}-inner-glow)`}
        animate={{
          d: [
            "M50 35 C56 42, 68 55, 65 75 C63 88, 58 96, 54 102 C52 105, 51 106, 50 106 C49 106, 48 105, 46 102 C42 96, 37 88, 35 75 C32 55, 44 42, 50 35 Z",
            "M50 32 C58 40, 66 53, 63 73 C61 86, 56 94, 52 100 C50 103, 50 104, 50 104 C50 104, 50 103, 48 100 C44 94, 39 86, 37 73 C34 53, 42 40, 50 32 Z",
            "M50 38 C54 44, 64 57, 61 77 C59 90, 54 98, 50 104 C49 107, 50 108, 50 108 C50 108, 51 107, 50 104 C46 98, 41 90, 39 77 C36 57, 46 44, 50 38 Z",
            "M50 35 C56 42, 68 55, 65 75 C63 88, 58 96, 54 102 C52 105, 51 106, 50 106 C49 106, 48 105, 46 102 C42 96, 37 88, 35 75 C32 55, 44 42, 50 35 Z",
          ]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      
      {/* Bright core */}
      {intensity > 0.4 && (
        <motion.ellipse
          cx="50"
          cy="85"
          rx={8 + intensity * 6}
          ry={14 + intensity * 8}
          fill={`url(#${id}-core)`}
          animate={{
            ry: [14 + intensity * 8, 12 + intensity * 6, 16 + intensity * 10, 14 + intensity * 8],
            opacity: [0.9, 0.7, 1, 0.9],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Highlight shine - 3D effect */}
      <motion.path
        d="M38 30 
           C42 25, 48 22, 52 25 
           C56 28, 58 35, 55 45 
           C52 55, 45 50, 42 40 
           C40 34, 36 32, 38 30 Z"
        fill={`url(#${id}-shine)`}
        opacity={0.6}
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Sparks/embers for higher levels */}
      {intensity > 0.6 && (
        <>
          <motion.circle
            cx="35"
            cy="60"
            r="2"
            fill={colors.core}
            animate={{
              cy: [60, 20, 60],
              cx: [35, 30, 35],
              opacity: [1, 0, 1],
              r: [2, 1, 2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx="65"
            cy="55"
            r="1.5"
            fill={colors.highlight}
            animate={{
              cy: [55, 15, 55],
              cx: [65, 70, 65],
              opacity: [1, 0, 1],
              r: [1.5, 0.5, 1.5],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="1.5"
            fill={colors.inner}
            animate={{
              cy: [50, 5, 50],
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.6,
            }}
          />
        </>
      )}
    </svg>
  );
};

// Animated particles for higher levels
const FlameParticles = ({ level, size }: { level: SparkLevel; size: number }) => {
  if (level < 3) return null;
  
  const particleCount = level === 3 ? 4 : level === 4 ? 6 : 10;
  const config = LEVEL_CONFIG[level];
  
  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
            background: `radial-gradient(circle, ${config.colors.highlight}, ${config.colors.core})`,
            left: `${25 + Math.random() * 50}%`,
            bottom: "15%",
            boxShadow: `0 0 ${4 + Math.random() * 4}px ${config.colors.core}`,
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: [0, -size * 1.2],
            opacity: [1, 0],
            scale: [1, 0.3],
            x: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            duration: 1 + Math.random() * 0.8,
            repeat: Infinity,
            delay: Math.random() * 1,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
};

// Glow animation variants
const glowVariants: Variants = {
  idle: {
    opacity: [0.4, 0.6, 0.4],
    scale: [1, 1.15, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  intense: {
    opacity: [0.5, 0.9, 0.5],
    scale: [1, 1.25, 1],
    transition: {
      duration: 1.5,
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
  const uniqueId = `flame-${level}-${size}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: sizeConfig.container, 
          height: sizeConfig.container 
        }}
      >
        {/* Multi-layer glow effect */}
        {animate && level >= 2 && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ 
                backgroundColor: config.glowColor,
                filter: 'blur(20px)',
              }}
              variants={glowVariants}
              animate={level >= 4 ? "intense" : "idle"}
            />
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{ 
                backgroundColor: config.colors.middle,
                opacity: 0.3,
                filter: 'blur(12px)',
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [0.9, 1.05, 0.9],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}
        
        {/* Main flame container */}
        <motion.div
          className="relative z-10"
          style={{ 
            width: sizeConfig.flame, 
            height: sizeConfig.flame * 1.3,
          }}
          animate={animate ? {
            scale: [1, 1.03, 0.98, 1.02, 1],
            rotate: [0, -1, 1, -0.5, 0],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Flame3D colors={config.colors} intensity={config.intensity} id={uniqueId} />
          
          {/* Particles */}
          {animate && (
            <FlameParticles level={level} size={sizeConfig.flame} />
          )}
        </motion.div>
        
        {/* Ember base for level 1 */}
        {level === 1 && (
          <motion.div
            className="absolute bottom-2 w-3/4 h-3 rounded-full"
            style={{
              background: `linear-gradient(to top, ${config.colors.outer}, ${config.colors.core})`,
              boxShadow: `0 0 10px ${config.glowColor}`,
            }}
            animate={animate ? {
              opacity: [0.6, 0.9, 0.6],
              scale: [1, 1.05, 1],
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
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px solid',
                  borderColor: config.colors.core,
                  boxShadow: `0 0 10px ${config.colors.core}`,
                }}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{
                  scale: [0.8, 2],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </div>
      
      {showLabel && (
        <motion.div 
          className={cn("flex items-center gap-1.5 font-semibold", sizeConfig.label)}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-lg">{config.emoji}</span>
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${config.colors.outer}, ${config.colors.core})`,
            }}
          >
            {config.name}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for nav/headers - also enhanced
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
        background: `linear-gradient(135deg, ${config.colors.outer}15, ${config.colors.middle}10)`,
      }}
      whileHover={{ scale: 1.08, boxShadow: `0 0 15px ${config.glowColor}` }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Mini glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: config.glowColor }}
        animate={{
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Mini flame icon */}
      <div className="relative w-5 h-6 flex-shrink-0">
        <svg viewBox="0 0 24 30" className="w-full h-full">
          <defs>
            <linearGradient id="mini-flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={config.colors.outer} />
              <stop offset="50%" stopColor={config.colors.middle} />
              <stop offset="100%" stopColor={config.colors.core} />
            </linearGradient>
            <filter id="mini-glow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            d="M12 2 C15 6, 22 10, 20 18 C19 23, 15 27, 12 28 C9 27, 5 23, 4 18 C2 10, 9 6, 12 2 Z"
            fill="url(#mini-flame-grad)"
            filter="url(#mini-glow)"
            animate={{
              d: [
                "M12 2 C15 6, 22 10, 20 18 C19 23, 15 27, 12 28 C9 27, 5 23, 4 18 C2 10, 9 6, 12 2 Z",
                "M12 1 C16 5, 21 11, 19 17 C18 22, 14 26, 12 27 C10 26, 6 22, 5 17 C3 11, 8 5, 12 1 Z",
                "M12 3 C14 7, 20 12, 18 19 C17 24, 14 28, 12 29 C10 28, 7 24, 6 19 C4 12, 10 7, 12 3 Z",
                "M12 2 C15 6, 22 10, 20 18 C19 23, 15 27, 12 28 C9 27, 5 23, 4 18 C2 10, 9 6, 12 2 Z",
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Inner bright core */}
          <motion.ellipse
            cx="12"
            cy="20"
            rx="4"
            ry="6"
            fill={config.colors.core}
            opacity={0.8}
            animate={{
              ry: [6, 5, 7, 6],
              opacity: [0.8, 0.6, 0.9, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>
      
      <span 
        className="relative text-sm font-bold tabular-nums"
        style={{
          background: `linear-gradient(135deg, ${config.colors.middle}, ${config.colors.core})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {energy}
      </span>
    </motion.button>
  );
}

export default SparkFlame;
