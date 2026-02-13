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
    <svg
      viewBox="0 0 500 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeMap[size]} w-auto ${className}`}
      aria-label="KIKI - Para gente diferente, y punto."
      role="img"
    >
      {/* Red Heart above the last I */}
      <path
        d="M432 30 C432 15, 443 5, 455 5 C467 5, 478 15, 478 28 C478 15, 489 5, 501 5 C513 5, 524 15, 524 28 C524 52, 478 70, 478 70 C478 70, 432 52, 432 30 Z"
        fill="#E63946"
        transform="translate(-30, 0) scale(0.65)"
      />

      {/* K1 */}
      <g fill="#111111">
        <rect x="15" y="70" width="45" height="185" />
        <polygon points="60,162 145,70 200,70 112,162" />
        <polygon points="60,162 145,255 200,255 112,162" />
      </g>

      {/* I1 */}
      <rect x="205" y="70" width="45" height="185" fill="#111111" />

      {/* K2 */}
      <g fill="#111111">
        <rect x="260" y="70" width="45" height="185" />
        <polygon points="305,162 390,70 445,70 357,162" />
        <polygon points="305,162 390,255 445,255 357,162" />
      </g>

      {/* I2 */}
      <rect x="450" y="70" width="45" height="185" fill="#111111" />

      {/* "Para gente diferente," */}
      <text
        x="250"
        y="310"
        textAnchor="middle"
        fontFamily="'Arial', 'Helvetica', sans-serif"
        fontSize="34"
        fontWeight="400"
        fontStyle="italic"
        fill="#111111"
      >
        Para gente diferente,
      </text>

      {/* "y punto." */}
      <text
        x="250"
        y="355"
        textAnchor="middle"
        fontFamily="'Arial', 'Helvetica', sans-serif"
        fontSize="34"
        fontWeight="400"
        fontStyle="italic"
        fill="#111111"
      >
        y punto.
      </text>
    </svg>
  );
};

export default KikiLogo;
