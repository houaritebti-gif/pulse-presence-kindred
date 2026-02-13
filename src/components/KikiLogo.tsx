import { Heart } from "lucide-react";

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
    // Letras más grandes
    text: "text-7xl md:text-8xl lg:text-9xl",
    heart: "w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10",
    // Corazón posicionado ligeramente a la izquierda del centro de la I
    heartPos: "-top-2 md:-top-3 lg:-top-4 left-1/4 -translate-x-1/2",
    marginLeft: "",
    glow: true,
  },
};

export const KikiLogo = ({ size = "md", animate = true, className = "", variant = "default" }: KikiLogoProps) => {
  const s = sizeClasses[size];
  const isHero = size === "hero";
  
  // Heart element with heartbeat pump animation
  const heartElement = isHero ? (
    <div className={`absolute ${s.heartPos}`}>
      <div className={animate ? "kiki-heartbeat" : ""} style={{ willChange: "transform" }}>
        <Heart 
          className={`${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
        />
      </div>
    </div>
  ) : (
    <span className={`absolute ${s.heartPos}`}>
      <span className={animate ? "kiki-heartbeat" : ""} style={{ willChange: "transform", display: "inline-flex" }}>
        <Heart 
          className={`${s.heart} text-kiki-red-warm fill-kiki-red-warm`}
        />
      </span>
    </span>
  );
  
  const textColorClass = variant === "dark" ? "text-kiki-black" : "text-foreground";
  
  return (
    <span 
      className={`inline-flex items-baseline leading-none tracking-tight font-bold ${textColorClass} ${className} relative overflow-visible`}
      style={{ fontFamily: '"Avenir Next Heavy", "Avenir Black", "Avenir Heavy", Avenir, system-ui, sans-serif', fontWeight: 900 }}
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
