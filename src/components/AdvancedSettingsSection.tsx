import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Sun, Moon, Monitor, Sparkles, Type, LayoutGrid, Settings2, Volume2, Contrast } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAdvancedSettings, Theme, TextSize } from "@/hooks/useAdvancedSettings";
import { isThemeSoundEnabled, setThemeSoundEnabled } from "@/utils/notificationSound";

const AdvancedSettingsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const [themeSoundOn, setThemeSoundOn] = useState(true);
  
  const {
    theme,
    reduceMotion,
    textSize,
    compactMode,
    highContrast,
    setTheme,
    setReduceMotion,
    setTextSize,
    setCompactMode,
    setHighContrast,
  } = useAdvancedSettings();

  useEffect(() => {
    setThemeSoundOn(isThemeSoundEnabled());
  }, []);

  const handleThemeSoundChange = (enabled: boolean) => {
    setThemeSoundOn(enabled);
    setThemeSoundEnabled(enabled);
  };

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  const textSizeOptions: { value: TextSize; label: string }[] = [
    { value: "small", label: "Pequeño" },
    { value: "normal", label: "Normal" },
    { value: "large", label: "Grande" },
  ];

  return (
    <div className="mb-10 animate-fade-up animate-delay-600">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-accent" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Ajustes avanzados
          </h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Theme Selection */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-foreground" />
              ) : theme === "light" ? (
                <Sun className="w-5 h-5 text-foreground" />
              ) : (
                <Monitor className="w-5 h-5 text-foreground" />
              )}
              <span className="font-body text-sm text-foreground">Tema</span>
            </div>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-body transition-colors ${
                      theme === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Size */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-foreground" />
              <span className="font-body text-sm text-foreground">Tamaño de texto</span>
            </div>
            <div className="flex gap-2">
              {textSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTextSize(option.value)}
                  className={`flex-1 py-2 px-3 rounded-lg font-body transition-colors ${
                    textSize === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  } ${
                    option.value === "small" ? "text-xs" : option.value === "large" ? "text-base" : "text-sm"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles className={`w-5 h-5 ${!reduceMotion ? "text-foreground" : "text-muted-foreground"}`} />
              <div>
                <span className="font-body text-sm text-foreground block">
                  {reduceMotion ? "Animaciones reducidas" : "Animaciones activas"}
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Reduce el movimiento para mayor accesibilidad
                </span>
              </div>
            </div>
            <Switch
              checked={!reduceMotion}
              onCheckedChange={(checked) => setReduceMotion(!checked)}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <LayoutGrid className={`w-5 h-5 ${compactMode ? "text-foreground" : "text-muted-foreground"}`} />
              <div>
                <span className="font-body text-sm text-foreground block">
                  {compactMode ? "Modo compacto activado" : "Modo compacto"}
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Menos espaciado entre elementos
                </span>
              </div>
            </div>
            <Switch
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Contrast className={`w-5 h-5 ${highContrast ? "text-foreground" : "text-muted-foreground"}`} />
              <div>
                <span className="font-body text-sm text-foreground block">
                  {highContrast ? "Alto contraste activado" : "Alto contraste"}
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Mayor legibilidad visual
                </span>
              </div>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>

          {/* Theme Sound */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Volume2 className={`w-5 h-5 ${themeSoundOn ? "text-foreground" : "text-muted-foreground"}`} />
              <div>
                <span className="font-body text-sm text-foreground block">
                  Sonido al cambiar tema
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Reproduce un clic sutil al alternar
                </span>
              </div>
            </div>
            <Switch
              checked={themeSoundOn}
              onCheckedChange={handleThemeSoundChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettingsSection;
