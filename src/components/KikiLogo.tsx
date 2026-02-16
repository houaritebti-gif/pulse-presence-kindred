import kikiLogo from "@/assets/kiki-logo-transparent.png";

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
