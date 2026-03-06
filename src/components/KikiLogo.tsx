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

/**
 * Compact sizes: show the full-width logo image but clip the bottom tagline.
 * The image aspect is ~1:1 (1079x1078). KIKI + heart occupies roughly the top 62%.
 * We set the visible height to 62% of the width to crop the tagline.
 */
const compactWidthMap = {
  sm: 72,
  md: 96,
  lg: 120,
  xl: 148,
  hero: 400,
};

export const KikiLogo = ({ size = "md", className = "", compact = false }: KikiLogoProps) => {
  if (compact) {
    const w = compactWidthMap[size];
    const visibleH = Math.round(w * 0.56); // crop at ~56% to fully hide tagline dots
    return (
      <div
        className={`overflow-hidden relative ${className}`}
        style={{ width: w, height: visibleH }}
        aria-label="KIKI"
        role="img"
      >
        <img
          src={kikiLogo}
          alt="KIKI"
          style={{ width: w, height: w, display: 'block' }}
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
