import kikiLogo from "@/assets/kiki-logo-transparent.png";

interface KikiLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
  variant?: "default" | "dark";
}

const sizeMap = {
  sm: "h-8",
  md: "h-10 sm:h-12",
  lg: "h-14 sm:h-16",
  xl: "h-18 sm:h-20",
  hero: "h-64 md:h-72 lg:h-80",
};

export const KikiLogo = ({ size = "md", className = "" }: KikiLogoProps) => {
  return (
    <img
      src={kikiLogo}
      alt="KIKI - Para gente diferente, y punto."
      className={`${sizeMap[size]} w-auto ${className}`}
    />
  );
};

export default KikiLogo;
