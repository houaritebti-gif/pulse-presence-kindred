import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark"; // dark = black text for light backgrounds
}

const sizeClasses = {
  sm: {
    text: "text-lg",
    heart: "w-2.5 h-2.5",
    heartPos: "-top-1 -left-1",
    marginLeft: "-ml-0.5",
    glow: false,
  },
  md: {
    text: "text-xl sm:text-2xl",
    heart: "w-3 h-3 sm:w-3.5 sm:h-3.5",
    heartPos: "-top-1.5 -left-1.5 sm:-top-2 sm:-left-2",
    marginLeft: "-ml-0.5",
    glow: false,
  },
  lg: {
    text: "text-2xl sm:text-3xl",
    heart: "w-4 h-4 sm:w-5 sm:h-5",
    heartPos: "-top-2 -left-2 sm:-top-2.5 sm:-left-2.5",
    marginLeft: "-ml-1",
    glow: false,
  },
  xl: {
    text: "text-4xl sm:text-5xl",
    heart: "w-5 h-5 sm:w-6 sm:h-6",
    heartPos: "-top-3 -left-2.5 sm:-top-4 sm:-left-3",
    marginLeft: "-ml-1",
    glow: true,
  },
  hero: {
    text: "text-6xl md:text-7xl lg:text-8xl",
    heart: "w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10",
    heartPos: "-top-4 md:-top-6 lg:-top-7 -left-3 md:-left-4 lg:-left-5",
    marginLeft: "-ml-1 md:-ml-1.5",
    glow: true,
  },
};

export const KikiLogo = ({ size = "md", animate = true, className = "", variant = "default" }: KikiLogoProps) => {
  const s = sizeClasses[size];
  const isHero = size === "hero";
  
  const heartElement = isHero ? (
    <motion.div 
      className={`absolute ${s.heartPos}`}
      animate={animate ? { scale: [1, 1.15, 1] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        {s.glow && (
          <motion.div 
            className="absolute inset-0 bg-primary/40 blur-xl rounded-full scale-150"
            animate={animate ? { opacity: [0.4, 0.7, 0.4] } : undefined}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Heart 
          className={`relative ${s.heart} text-primary fill-primary drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]`} 
        />
      </div>
    </motion.div>
  ) : (
    <span className={`absolute ${s.heartPos}`}>
      <Heart 
        className={`${s.heart} text-primary fill-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)] ${animate ? "animate-pulse-soft" : ""}`} 
      />
    </span>
  );
  
  const textColorClass = variant === "dark" ? "text-kiki-black" : "text-foreground";
  
  return (
    <span 
      className={`inline-flex items-baseline leading-none tracking-tight font-bold ${textColorClass} ${className}`}
      style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
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
