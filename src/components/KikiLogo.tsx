import { motion } from "framer-motion";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark"; // dark = black text for light backgrounds
}

const sizeClasses = {
  sm: {
    height: "h-5",
    heartSize: 10,
    heartOffset: { x: -2, y: -4 },
    glow: false,
  },
  md: {
    height: "h-6 sm:h-7",
    heartSize: 12,
    heartOffset: { x: -2, y: -5 },
    glow: false,
  },
  lg: {
    height: "h-8 sm:h-10",
    heartSize: 16,
    heartOffset: { x: -3, y: -6 },
    glow: false,
  },
  xl: {
    height: "h-12 sm:h-14",
    heartSize: 20,
    heartOffset: { x: -4, y: -8 },
    glow: true,
  },
  hero: {
    height: "h-16 md:h-20 lg:h-24",
    heartSize: 28,
    heartOffset: { x: -5, y: -10 },
    glow: true,
  },
};

// Custom K letter SVG - geometric style where diagonal arms meet at same point
const KLetter = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 28 32" fill="currentColor" className={className}>
    {/* Vertical bar - thinner */}
    <rect x="0" y="0" width="5" height="32" />
    {/* Upper diagonal arm - thinner, sharper angle */}
    <polygon points="5,16 28,0 28,5 5,18" />
    {/* Lower diagonal arm - thinner, sharper angle */}
    <polygon points="5,16 28,32 28,27 5,14" />
  </svg>
);

// I letter SVG
const ILetter = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 8 32" fill="currentColor" className={className}>
    <rect x="1" y="0" width="6" height="32" />
  </svg>
);

// Heart SVG
const HeartIcon = ({ className, size }: { className?: string; size: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ width: size, height: size }}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export const KikiLogo = ({ size = "md", animate = true, className = "", variant = "default" }: KikiLogoProps) => {
  const s = sizeClasses[size];
  const isHero = size === "hero" || size === "xl";
  
  const textColorClass = variant === "dark" ? "text-kiki-black" : "text-foreground";
  
  // Subtle shadow for visual depth
  const filterStyle = variant === "dark" 
    ? "drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.12))" 
    : "drop-shadow(2px 2px 10px rgba(0, 0, 0, 0.25))";
  
  // Shimmer animation only for larger sizes when animate is true
  const showShimmer = animate && (size === "hero" || size === "xl" || size === "lg");

  const heartElement = isHero ? (
    <motion.div 
      className="absolute"
      style={{ 
        right: s.heartOffset.x, 
        top: s.heartOffset.y 
      }}
      animate={animate ? { scale: [1, 1.15, 1] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative">
        {s.glow && (
          <motion.div 
            className="absolute inset-0 bg-kiki-red-warm/40 blur-xl rounded-full scale-150"
            animate={animate ? { opacity: [0.4, 0.7, 0.4] } : undefined}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <HeartIcon 
          size={s.heartSize}
          className="relative text-kiki-red-warm drop-shadow-[0_0_15px_hsl(var(--kiki-red-warm)/0.5)]" 
        />
      </div>
    </motion.div>
  ) : (
    <div 
      className="absolute"
      style={{ 
        right: s.heartOffset.x, 
        top: s.heartOffset.y 
      }}
    >
      <HeartIcon 
        size={s.heartSize}
        className={`text-kiki-red-warm drop-shadow-[0_0_8px_hsl(var(--kiki-red-warm)/0.4)] ${animate ? "animate-pulse-soft" : ""}`} 
      />
    </div>
  );
  
  return (
    <span 
      className={`inline-flex items-center ${s.height} ${textColorClass} ${className} relative`}
      style={{ filter: filterStyle }}
    >
      {/* Shimmer overlay */}
      {showShimmer && (
        <span 
          className="absolute inset-0 overflow-hidden pointer-events-none z-10"
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
      
      {/* K */}
      <KLetter className="h-full w-auto" />
      {/* I */}
      <ILetter className="h-full w-auto -ml-[2px]" />
      {/* K */}
      <KLetter className="h-full w-auto -ml-[2px]" />
      {/* I with heart */}
      <span className="relative h-full">
        <ILetter className="h-full w-auto -ml-[2px]" />
        {heartElement}
      </span>
    </span>
  );
};

export default KikiLogo;
