import kikiLogo from "@/assets/kiki-logo-transparent.png";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark";
  /** If true, crops the tagline out showing only "KIKI" + heart */
  compact?: boolean;
}

const sizeMap = {
  sm: "h-8",
  md: "h-10 sm:h-12",
  lg: "h-14 sm:h-16",
  xl: "h-18 sm:h-20",
  hero: "h-64 md:h-72 lg:h-80",
};

const compactSizeMap = {
  sm: { height: 28, width: 80 },
  md: { height: 36, width: 100 },
  lg: { height: 44, width: 124 },
  xl: { height: 52, width: 148 },
  hero: { height: 200, width: 560 },
};

export const KikiLogo = ({ size = "md", className = "", compact = false }: KikiLogoProps) => {
  if (compact) {
    const dims = compactSizeMap[size];
    return (
      <div
        className={`overflow-hidden relative ${className}`}
        style={{ 
          width: dims.width, 
          height: dims.height,
        }}
        aria-label="KIKI"
        role="img"
      >
        <img
          src={kikiLogo}
          alt="KIKI"
          className="absolute top-0 left-0 w-full"
          style={{
            height: `${Math.round(dims.height / 0.6)}px`,
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      </div>
    );
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
