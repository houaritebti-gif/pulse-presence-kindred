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
    heartPos: "-top-1 md:-top-2 lg:-top-3 -left-1 md:-left-1.5 lg:-left-2",
    marginLeft: "",
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
        scale: [1, 1.06, 1.02, 1.05, 1],
        rotate: [0, -0.8, 0.8, -0.4, 0],
      } : undefined}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        {/* Outer orange glow - subtle flame */}
        <motion.div 
          className="absolute inset-0 blur-3xl rounded-full"
          style={{ backgroundColor: 'hsl(25 100% 50% / 0.12)' }}
          animate={animate ? { 
            opacity: [0.08, 0.15, 0.1, 0.14, 0.08], 
            scale: [2.2, 2.5, 2.3, 2.45, 2.2] 
          } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Middle red glow - gentle pulse */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/30 blur-xl rounded-full"
          animate={animate ? { 
            opacity: [0.25, 0.38, 0.28, 0.35, 0.25], 
            scale: [1.6, 1.8, 1.65, 1.75, 1.6] 
          } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        {/* Inner glow */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/20 blur-lg rounded-full"
          animate={animate ? { 
            opacity: [0.15, 0.28, 0.18, 0.25, 0.15], 
            scale: [1.3, 1.45, 1.35, 1.42, 1.3] 
          } : undefined}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.div
          animate={animate ? {
            filter: [
              'drop-shadow(0 0 5px hsl(var(--kiki-red-warm) / 0.4)) drop-shadow(0 0 10px hsl(var(--kiki-red-warm) / 0.25))',
              'drop-shadow(0 0 7px hsl(var(--kiki-red-warm) / 0.55)) drop-shadow(0 0 14px hsl(var(--kiki-red-warm) / 0.3))',
              'drop-shadow(0 0 5px hsl(var(--kiki-red-warm) / 0.4)) drop-shadow(0 0 10px hsl(var(--kiki-red-warm) / 0.25))',
            ]
          } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
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
        scale: [1, 1.05, 1.02, 1.04, 1],
        rotate: [0, -0.6, 0.6, -0.3, 0],
      } : undefined}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        {/* Outer orange glow for smaller sizes */}
        <motion.div 
          className="absolute inset-0 blur-lg rounded-full"
          style={{ backgroundColor: 'hsl(25 100% 50% / 0.1)' }}
          animate={animate ? { opacity: [0.06, 0.12, 0.08, 0.11, 0.06], scale: [1.4, 1.6, 1.45, 1.55, 1.4] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Red glow */}
        <motion.div 
          className="absolute inset-0 bg-kiki-red-warm/25 blur-md rounded-full"
          animate={animate ? { opacity: [0.2, 0.32, 0.24, 0.3, 0.2], scale: [1.1, 1.25, 1.15, 1.22, 1.1] } : undefined}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
        />
        <Heart 
          className={`relative ${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
          style={{ filter: 'drop-shadow(0 0 4px hsl(var(--kiki-red-warm) / 0.35)) drop-shadow(0 0 8px hsl(var(--kiki-red-warm) / 0.18))' }}
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
