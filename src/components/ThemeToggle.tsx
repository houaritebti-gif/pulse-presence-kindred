import { Moon, Sun } from "lucide-react";
import { getTheme, setTheme, type Theme } from "@/hooks/useAdvancedSettings";
import { useState, useEffect } from "react";

export const ThemeToggle = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme);
  const [isDark, setIsDark] = useState(false);

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
    const newTheme: Theme = isDark ? "light" : "dark";
    setTheme(newTheme);
    setCurrentTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};
