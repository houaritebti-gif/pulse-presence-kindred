import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark"; // dark = black text for light backgrounds
}

const sizeConfig = {
  sm: {
    kWidth: 14,
    kHeight: 18,
    iWidth: 4,
    iHeight: 18,
    gap: 2,
    heart: "w-2.5 h-2.5",
    heartOffset: { top: -4, left: -2 },
    glow: false,
  },
  md: {
    kWidth: 20,
    kHeight: 26,
    iWidth: 6,
    iHeight: 26,
    gap: 3,
    heart: "w-3.5 h-3.5",
    heartOffset: { top: -6, left: -3 },
    glow: false,
  },
  lg: {
    kWidth: 28,
    kHeight: 36,
    iWidth: 8,
    iHeight: 36,
    gap: 4,
    heart: "w-5 h-5",
    heartOffset: { top: -8, left: -4 },
    glow: false,
  },
  xl: {
    kWidth: 40,
    kHeight: 52,
    iWidth: 12,
    iHeight: 52,
    gap: 6,
    heart: "w-6 h-6",
    heartOffset: { top: -12, left: -5 },
    glow: true,
  },
  hero: {
    kWidth: 56,
    kHeight: 72,
    iWidth: 16,
    iHeight: 72,
    gap: 8,
    heart: "w-8 h-8",
    heartOffset: { top: -16, left: -6 },
    glow: true,
  },
};

// Symmetric K shape - strokes meet at center point
const KShape = ({ width, height, fill }: { width: number; height: number; fill: string }) => {
  const stemWidth = width * 0.32;
  const armThickness = height * 0.18;
  const centerY = height / 2;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {/* Vertical stem */}
      <rect x="0" y="0" width={stemWidth} height={height} fill={fill} />
      {/* Upper diagonal arm */}
      <polygon 
        points={`
          ${stemWidth},${centerY - armThickness/2}
          ${stemWidth},${centerY + armThickness/2}
          ${width},${armThickness}
          ${width},0
        `}
        fill={fill}
      />
      {/* Lower diagonal arm */}
      <polygon 
        points={`
          ${stemWidth},${centerY - armThickness/2}
          ${stemWidth},${centerY + armThickness/2}
          ${width},${height}
          ${width},${height - armThickness}
        `}
        fill={fill}
      />
    </svg>
  );
};

// Simple I shape
const IShape = ({ width, height, fill }: { width: number; height: number; fill: string }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
    <rect x="0" y="0" width={width} height={height} fill={fill} />
  </svg>
);

export const KikiLogo = ({ size = "md", animate = true, className = "", variant = "default" }: KikiLogoProps) => {
  const s = sizeConfig[size];
  const isHero = size === "hero" || size === "xl";
  
  const fillColor = variant === "dark" ? "hsl(var(--kiki-black))" : "currentColor";
  
  const heartElement = isHero ? (
    <motion.div 
      className="absolute"
      style={{ top: s.heartOffset.top, left: s.heartOffset.left }}
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
        <Heart 
          className={`relative ${s.heart} text-kiki-red-warm fill-kiki-red-warm drop-shadow-[0_0_15px_hsl(var(--kiki-red-warm)/0.5)]`} 
        />
      </div>
    </motion.div>
  ) : (
    <div 
      className="absolute"
      style={{ top: s.heartOffset.top, left: s.heartOffset.left }}
    >
      <Heart 
        className={`${s.heart} text-kiki-red-warm fill-kiki-red-warm drop-shadow-[0_0_8px_hsl(var(--kiki-red-warm)/0.4)] ${animate ? "animate-pulse-soft" : ""}`} 
      />
    </div>
  );
  
  const textColorClass = variant === "dark" ? "text-kiki-black" : "text-foreground";
  
  // Subtle shadow for visual depth
  const dropShadow = variant === "dark" 
    ? "drop-shadow-[2px_2px_8px_rgba(0,0,0,0.12)]" 
    : "drop-shadow-[2px_2px_10px_rgba(0,0,0,0.25)]";
  
  return (
    <div 
      className={`inline-flex items-center ${textColorClass} ${dropShadow} ${className}`}
      style={{ gap: s.gap }}
    >
      <KShape width={s.kWidth} height={s.kHeight} fill={fillColor} />
      <IShape width={s.iWidth} height={s.iHeight} fill={fillColor} />
      <KShape width={s.kWidth} height={s.kHeight} fill={fillColor} />
      <div className="relative">
        {heartElement}
        <IShape width={s.iWidth} height={s.iHeight} fill={fillColor} />
      </div>
    </div>
  );
};

export default KikiLogo;
