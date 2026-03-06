import kikiLogo from "@/assets/kiki-logo-transparent.png";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark";
  /** If true, renders a compact text-based "KIKI" logo without the tagline */
  compact?: boolean;
}

const sizeMap = {
  sm: "h-8",
  md: "h-10 sm:h-12",
  lg: "h-14 sm:h-16",
  xl: "h-18 sm:h-20",
  hero: "h-64 md:h-72 lg:h-80",
};

const compactTextSize = {
  sm: "text-xl",
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
  xl: "text-4xl sm:text-5xl",
  hero: "text-7xl md:text-8xl",
};

const compactHeartSize = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  hero: 40,
};

/** Compact text-based KIKI logo with red heart */
const CompactKikiLogo = ({ size = "md", className = "" }: KikiLogoProps) => {
  const heartSize = compactHeartSize[size] || 16;

  return (
    <span
      className={`inline-flex items-baseline font-black tracking-tight select-none ${compactTextSize[size]} ${className}`}
      style={{ fontFamily: "'LEMONMILK', 'Arial Black', sans-serif", lineHeight: 1 }}
      aria-label="KIKI"
    >
      <span className="text-foreground">K</span>
      <span className="text-foreground">I</span>
      <span className="text-foreground">K</span>
      <span className="relative text-foreground">
        I
        <svg
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute"
          style={{
            width: heartSize,
            height: heartSize,
            top: `-${heartSize * 0.35}px`,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <path
            d="M50 85 C25 60 0 40 0 25 C0 10 12 0 25 0 C35 0 45 8 50 15 C55 8 65 0 75 0 C88 0 100 10 100 25 C100 40 75 60 50 85Z"
            fill="#EB1C00"
          />
        </svg>
      </span>
    </span>
  );
};

export const KikiLogo = ({ size = "md", className = "", compact = false, ...rest }: KikiLogoProps) => {
  if (compact) {
    return <CompactKikiLogo size={size} className={className} {...rest} />;
  }

  return (
    <img
      src={kikiLogo}
      alt="KIKI - Para gente diferente, y punto."
      className={`${sizeMap[size]} w-auto ${className}`}
    />
  );
};

export default KikiLogo;
