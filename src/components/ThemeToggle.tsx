import { Moon, Sun } from "lucide-react";
import { getTheme, setTheme, type Theme } from "@/hooks/useAdvancedSettings";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme);
  const [isDark, setIsDark] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const updateDarkState = () => {
      const theme = getTheme();
      if (theme === "system") {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      } else {
        setIsDark(theme === "dark");
      }
    };

    updateDarkState();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateDarkState);
    
    return () => mediaQuery.removeEventListener("change", updateDarkState);
  }, [currentTheme]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    const newTheme: Theme = isDark ? "light" : "dark";
    setTheme(newTheme);
    setCurrentTheme(newTheme);
    
    // Remove transitioning state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={cn(
        "p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300",
        isTransitioning && "pointer-events-none"
      )}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div className={cn(
        "transition-transform duration-300",
        isTransitioning && "animate-spin"
      )}>
        {isDark ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </div>
    </button>
  );
};
