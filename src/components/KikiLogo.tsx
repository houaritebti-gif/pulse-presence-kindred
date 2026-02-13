interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark";
  transparent?: boolean;
}

const sizeConfig = {
  sm: { text: "text-xl", heart: "w-2.5 h-2.5", subtitle: "text-[5px]", gap: "gap-0" },
  md: { text: "text-2xl sm:text-3xl", heart: "w-3 h-3 sm:w-3.5 sm:h-3.5", subtitle: "text-[6px] sm:text-[7px]", gap: "gap-0" },
  lg: { text: "text-3xl sm:text-4xl", heart: "w-4 h-4 sm:w-5 sm:h-5", subtitle: "text-[7px] sm:text-[8px]", gap: "gap-0.5" },
  xl: { text: "text-4xl sm:text-5xl", heart: "w-5 h-5 sm:w-6 sm:h-6", subtitle: "text-[8px] sm:text-[10px]", gap: "gap-0.5" },
  hero: { text: "text-7xl md:text-8xl lg:text-9xl", heart: "w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12", subtitle: "text-sm md:text-base lg:text-lg", gap: "gap-1 md:gap-2" },
};

const HeartIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export const KikiLogo = ({ size = "md", className = "" }: KikiLogoProps) => {
  const config = sizeConfig[size];
  const isHero = size === "hero";

  return (
    <div className={`flex flex-col items-center ${config.gap} select-none ${className}`}>
      {/* KIKI text with heart on the I */}
      <div className="relative inline-flex items-end leading-none">
        <span className={`${config.text} font-black tracking-tight text-kiki-black`} style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
          KIK
        </span>
        <span className="relative">
          <span className={`${config.text} font-black tracking-tight text-kiki-black`} style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
            İ
          </span>
          <HeartIcon className={`${config.heart} text-red-600 absolute -top-[15%] left-1/2 -translate-x-1/2`} />
        </span>
      </div>
      {/* Subtitle */}
      {isHero && (
        <p className={`${config.subtitle} font-semibold text-kiki-black tracking-wide`} style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
          Para gente diferente,
          <br />
          y punto.
        </p>
      )}
    </div>
  );
};

export default KikiLogo;
