import kikiLogoSrc from "@/assets/kiki-logo-transparent.png";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark";
}

const sizeMap = {
  sm: "h-6",
  md: "h-8 sm:h-10",
  lg: "h-10 sm:h-12",
  xl: "h-14 sm:h-16",
  hero: "h-48 md:h-56 lg:h-64",
};

export const KikiLogo = ({ size = "md", className = "" }: KikiLogoProps) => {
  return (
    <img
      src={kikiLogoSrc}
      alt="KIKI - Para gente diferente, y punto."
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
      loading="eager"
    />
  );
};

export default KikiLogo;
