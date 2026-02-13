import kikiLogoSrc from "@/assets/kiki-logo.jpg";

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
  hero: "h-40 md:h-52 lg:h-64",
};

export const KikiLogo = ({ size = "md", className = "" }: KikiLogoProps) => {
  const isHero = size === "hero";
  return (
    <img
      src={kikiLogoSrc}
      alt="KIKI"
      className={`${sizeMap[size]} w-auto object-contain ${isHero ? "rounded-3xl shadow-xl" : ""} ${className}`}
      loading="eager"
    />
  );
};

export default KikiLogo;
