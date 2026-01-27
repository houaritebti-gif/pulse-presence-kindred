import { Heart } from "lucide-react";
import { MotionConfig, motion } from "framer-motion";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark"; // dark = black text for light backgrounds
}

const sizeClasses = {
  sm: {
    text: "text-lg",
    heart: "w-2 h-2",
    heartPos: "top-0 -left-0.5",
    marginLeft: "",
    glow: false,
  },
  md: {
    text: "text-xl sm:text-2xl",
    heart: "w-2.5 h-2.5 sm:w-3 sm:h-3",
    heartPos: "-top-0.5 sm:-top-1 -left-0.5 sm:-left-1",
    marginLeft: "",
    glow: false,
  },
  lg: {
    text: "text-2xl sm:text-3xl",
    heart: "w-3 h-3 sm:w-4 sm:h-4",
    heartPos: "-top-1 sm:-top-1.5 -left-1 sm:-left-1",
    marginLeft: "",
    glow: false,
  },
  xl: {
    text: "text-4xl sm:text-5xl",
    heart: "w-4 h-4 sm:w-5 sm:h-5",
    heartPos: "-top-1.5 sm:-top-2 -left-1 sm:-left-1.5",
    marginLeft: "",
    glow: true,
  },
  hero: {
    text: "text-6xl md:text-7xl lg:text-8xl",
    heart: "w-5 h-5 md:w-7 md:h-7 lg:w-9 lg:h-9",
    heartPos: "-top-3.5 md:-top-3 lg:-top-4 -left-1 md:-left-1.5 lg:-left-2",
    marginLeft: "",
    glow: true,
  },
};

export const KikiLogo = ({ size = "md", animate = true, className = "", variant = "default" }: KikiLogoProps) => {
  const s = sizeClasses[size];
  const isHero = size === "hero";
  
  // Heart element with heartbeat pump animation - more pronounced
  const heartElement = isHero ? (
    <div className={`absolute ${s.heartPos}`}>
      {/* Force heartbeat even when OS prefers-reduced-motion is enabled */}
      <MotionConfig reducedMotion="never">
        <motion.div
          initial={{ scale: 1 }}
          animate={animate ? {
            scale: [1, 1.25, 1, 1.2, 1],
          } : { scale: 1 }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.15, 0.3, 0.45, 0.7],
            repeatDelay: 0.5
          }}
          style={{ willChange: "transform" }}
        >
          <Heart 
            className={`${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
            style={{ filter: 'drop-shadow(0 0 8px hsl(var(--kiki-red-warm) / 0.6))' }}
          />
        </motion.div>
      </MotionConfig>
    </div>
  ) : (
    <span className={`absolute ${s.heartPos}`}>
      {/* Force heartbeat even when OS prefers-reduced-motion is enabled */}
      <MotionConfig reducedMotion="never">
        <motion.div
          initial={{ scale: 1 }}
          animate={animate ? {
            scale: [1, 1.22, 1, 1.18, 1],
          } : { scale: 1 }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.15, 0.3, 0.45, 0.7],
            repeatDelay: 0.5
          }}
          style={{ willChange: "transform" }}
        >
          <Heart 
            className={`${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--kiki-red-warm) / 0.5))' }}
          />
        </motion.div>
      </MotionConfig>
    </span>
  );
  
  const textColorClass = variant === "dark" ? "text-kiki-black" : "text-foreground";
  
  // Subtle shadow for visual depth
  const textShadow = variant === "dark" 
    ? "2px 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)" 
    : "2px 2px 10px rgba(0, 0, 0, 0.25), 0 6px 20px rgba(0, 0, 0, 0.15)";
  
  return (
    <span 
      className={`inline-flex items-baseline leading-none tracking-tight font-bold ${textColorClass} ${className} relative overflow-visible`}
      style={{ fontFamily: '"Avenir Next Heavy", "Avenir Black", "Avenir Heavy", Avenir, system-ui, sans-serif', fontWeight: 900, textShadow }}
    >
      <span className={s.text}>K</span>
      <span className={s.text}>I</span>
      <span className={s.text}>K</span>
      <span className={`relative ${s.marginLeft}`}>
        {heartElement}
        <span className={s.text}>I</span>
      </span>
    </span>
  );
};

export default KikiLogo;
