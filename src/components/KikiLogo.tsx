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
      animate={animate ? { 
        scale: [1, 1.12, 1.05, 1.15, 1],
        rotate: [0, -2, 2, -1, 0],
      } : undefined}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        {/* Outer orange glow - flame flicker */}
        <motion.div 
          className="absolute inset-0 blur-3xl rounded-full"
          style={{ backgroundColor: 'hsl(25 100% 50% / 0.15)' }}
          animate={animate ? { 
            opacity: [0.1, 0.25, 0.12, 0.22, 0.1], 
            scale: [2.2, 2.8, 2.4, 2.7, 2.2] 
          } : undefined}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Middle red glow - flicker */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/35 blur-xl rounded-full"
          animate={animate ? { 
            opacity: [0.3, 0.5, 0.35, 0.55, 0.3], 
            scale: [1.6, 2, 1.7, 1.9, 1.6] 
          } : undefined}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
        />
        {/* Inner intense glow */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/25 blur-lg rounded-full"
          animate={animate ? { 
            opacity: [0.2, 0.4, 0.25, 0.38, 0.2], 
            scale: [1.3, 1.6, 1.4, 1.55, 1.3] 
          } : undefined}
          transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
        />
        <motion.div
          animate={animate ? {
            filter: [
              'drop-shadow(0 0 6px hsl(var(--kiki-red-warm) / 0.5)) drop-shadow(0 0 12px hsl(var(--kiki-red-warm) / 0.3))',
              'drop-shadow(0 0 10px hsl(var(--kiki-red-warm) / 0.7)) drop-shadow(0 0 18px hsl(var(--kiki-red-warm) / 0.4))',
              'drop-shadow(0 0 7px hsl(var(--kiki-red-warm) / 0.55)) drop-shadow(0 0 14px hsl(var(--kiki-red-warm) / 0.32))',
              'drop-shadow(0 0 9px hsl(var(--kiki-red-warm) / 0.65)) drop-shadow(0 0 16px hsl(var(--kiki-red-warm) / 0.38))',
              'drop-shadow(0 0 6px hsl(var(--kiki-red-warm) / 0.5)) drop-shadow(0 0 12px hsl(var(--kiki-red-warm) / 0.3))',
            ]
          } : undefined}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart 
            className={`relative ${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
          />
        </motion.div>
      </div>
    </motion.div>
  ) : (
    <motion.span 
      className={`absolute ${s.heartPos}`}
      animate={animate ? { 
        scale: [1, 1.08, 1.03, 1.1, 1],
        rotate: [0, -1.5, 1.5, -0.5, 0],
      } : undefined}
      transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        {/* Outer orange glow for smaller sizes */}
        <motion.div 
          className="absolute inset-0 blur-lg rounded-full"
          style={{ backgroundColor: 'hsl(25 100% 50% / 0.12)' }}
          animate={animate ? { opacity: [0.08, 0.18, 0.1, 0.16, 0.08], scale: [1.4, 1.8, 1.5, 1.7, 1.4] } : undefined}
          transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Red glow */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/30 blur-md rounded-full"
          animate={animate ? { opacity: [0.25, 0.45, 0.3, 0.4, 0.25], scale: [1.1, 1.4, 1.2, 1.35, 1.1] } : undefined}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.08 }}
        />
        <Heart 
          className={`relative ${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
          style={{ filter: 'drop-shadow(0 0 5px hsl(var(--kiki-red-warm) / 0.45)) drop-shadow(0 0 10px hsl(var(--kiki-red-warm) / 0.2))' }}
        />
      </div>
    </motion.span>
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
