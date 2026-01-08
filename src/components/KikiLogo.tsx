import { Heart } from "lucide-react";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    text: "text-lg",
    heart: "w-2.5 h-2.5",
    heartPos: "-top-1 -left-1",
    marginLeft: "-ml-0.5",
  },
  md: {
    text: "text-xl",
    heart: "w-3 h-3",
    heartPos: "-top-1.5 -left-1.5",
    marginLeft: "-ml-0.5",
  },
  lg: {
    text: "text-2xl",
    heart: "w-4 h-4",
    heartPos: "-top-2 -left-2",
    marginLeft: "-ml-1",
  },
  xl: {
    text: "text-3xl",
    heart: "w-5 h-5",
    heartPos: "-top-2.5 -left-2.5",
    marginLeft: "-ml-1",
  },
};

export const KikiLogo = ({ size = "md", animate = true, className = "" }: KikiLogoProps) => {
  const s = sizeClasses[size];
  
  return (
    <span 
      className={`inline-flex items-baseline leading-none tracking-tight font-bold text-foreground ${className}`}
      style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
    >
      <span className={s.text}>K</span>
      <span className={s.text}>I</span>
      <span className={s.text}>K</span>
      <span className={`relative ${s.marginLeft}`}>
        <span 
          className={`absolute ${s.heartPos}`}
        >
          <Heart 
            className={`${s.heart} text-primary fill-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)] ${animate ? "animate-pulse-soft" : ""}`} 
          />
        </span>
        <span className={s.text}>I</span>
      </span>
    </span>
  );
};

export default KikiLogo;
