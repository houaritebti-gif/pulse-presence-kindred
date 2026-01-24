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
        {/* Outer orange glow - fire effect */}
        <motion.div 
          className="absolute inset-0 blur-3xl rounded-full scale-[3]"
          style={{ backgroundColor: 'hsl(25, 100%, 50%, 0.25)' }}
          animate={animate ? { opacity: [0.2, 0.4, 0.2], scale: [2.8, 3.2, 2.8] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        {/* Middle red glow */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/50 blur-xl rounded-full scale-[2]"
          animate={animate ? { opacity: [0.5, 0.8, 0.5] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner intense red glow */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/40 blur-2xl rounded-full scale-[2.5]"
          animate={animate ? { opacity: [0.3, 0.5, 0.3] } : undefined}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <Heart 
          className={`relative ${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
          style={{ filter: 'drop-shadow(0 0 12px hsl(var(--kiki-red-warm) / 0.7)) drop-shadow(0 0 20px hsl(var(--kiki-red-warm) / 0.4))' }}
        />
      </div>
    </motion.div>
  ) : (
    <span className={`absolute ${s.heartPos}`}>
      <div className="relative">
        {/* Outer orange glow for smaller sizes */}
        <div 
          className="absolute inset-0 blur-xl rounded-full scale-[2]"
          style={{ backgroundColor: 'hsl(25, 100%, 50%, 0.2)' }}
        />
        {/* Red glow */}
        <div className="absolute inset-0 bg-kiki-red-warm/40 blur-lg rounded-full scale-150" />
        <Heart 
          className={`relative ${s.heart} text-kiki-red-warm fill-kiki-red-warm ${animate ? "animate-pulse-soft" : ""}`}
          style={{ filter: 'drop-shadow(0 0 8px hsl(var(--kiki-red-warm) / 0.6)) drop-shadow(0 0 16px hsl(var(--kiki-red-warm) / 0.3))' }}
        />
      </div>
    </span>
  );
  
  const textColorClass = variant === "dark" ? "text-kiki-black" : "text-foreground";
  
  // Subtle shadow for visual depth
  const textShadow = variant === "dark" 
    ? "2px 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)" 
    : "2px 2px 10px rgba(0, 0, 0, 0.25), 0 6px 20px rgba(0, 0, 0, 0.15)";
  
  // Shimmer animation only for larger sizes when animate is true
  const showShimmer = animate && (size === "hero" || size === "xl" || size === "lg");
  
  return (
    <span 
      className={`inline-flex items-baseline leading-none tracking-tight font-bold ${textColorClass} ${className} relative overflow-visible`}
      style={{ fontFamily: '"Avenir Next Heavy", "Avenir Black", "Avenir Heavy", Avenir, system-ui, sans-serif', fontWeight: 900, textShadow }}
    >
      {/* Shimmer overlay */}
      {showShimmer && (
        <span 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ 
            maskImage: 'linear-gradient(to right, transparent, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)'
          }}
        >
          <span 
            className="absolute inset-0 animate-shimmer"
            style={{
              background: variant === "dark"
                ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              width: '200%',
            }}
          />
        </span>
      )}
      
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
