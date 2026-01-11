import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Sun, Moon, Monitor, Sparkles, Type, LayoutGrid, Settings2, Volume2, Contrast, Hand, Bell, MessageCircle, Calendar, Ghost, UserPlus, Play, Flame, MousePointer2, X, Stars, Heart, VolumeX, Users, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAdvancedSettings, Theme, TextSize, SparkleStyle } from "@/hooks/useAdvancedSettings";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  isThemeSoundEnabled, 
  setThemeSoundEnabled, 
  isEnergySoundEnabled, 
  setEnergySoundEnabled, 
  isActionSoundsEnabled,
  setActionSoundsEnabled,
  notifyUser, 
  playEnergyGainSound,
  playChispaSound,
  playSuperChispaSound,
  playPassSound,
  playSparkleStarsSound,
  playSparkleFireSound,
  playSparkleHeartsSound,
  getMasterVolume,
  setMasterVolume,
  updateMasterGainVolume,
} from "@/utils/notificationSound";

const AdvancedSettingsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const [themeSoundOn, setThemeSoundOn] = useState(true);
  const [energySoundOn, setEnergySoundOn] = useState(true);
  const [actionSoundsOn, setActionSoundsOn] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(0.7);
  const [notifyNewPresence, setNotifyNewPresence] = useState(true);
  const [isUpdatingPresenceNotif, setIsUpdatingPresenceNotif] = useState(false);
  const [notifyMinAge, setNotifyMinAge] = useState<number | null>(null);
  const [notifyMaxAge, setNotifyMaxAge] = useState<number | null>(null);
  const [isUpdatingAgeRange, setIsUpdatingAgeRange] = useState(false);
  const [notifySameCityOnly, setNotifySameCityOnly] = useState(false);
  const [isUpdatingSameCity, setIsUpdatingSameCity] = useState(false);
  const [notifySummaryHour, setNotifySummaryHour] = useState(9);
  const [isUpdatingSummaryHour, setIsUpdatingSummaryHour] = useState(false);
  
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  const {
    theme,
    reduceMotion,
    textSize,
    compactMode,
    highContrast,
    sparkleTrailEnabled,
    sparkleStyle,
    setTheme,
    setReduceMotion,
    setTextSize,
    setCompactMode,
    setHighContrast,
    setSparkleTrailEnabled,
    setSparkleStyle,
  } = useAdvancedSettings();

  useEffect(() => {
    setThemeSoundOn(isThemeSoundEnabled());
    setEnergySoundOn(isEnergySoundEnabled());
    setActionSoundsOn(isActionSoundsEnabled());
    setMasterVolumeState(getMasterVolume());
  }, []);

  // Sync presence notification preference from profile
  useEffect(() => {
    const profileWithPref = profile as typeof profile & { 
      notify_new_presence?: boolean;
      notify_min_age?: number | null;
      notify_max_age?: number | null;
      notify_same_city_only?: boolean;
      notify_summary_hour?: number;
    };
    if (profileWithPref?.notify_new_presence !== undefined) {
      setNotifyNewPresence(profileWithPref.notify_new_presence);
    }
    if (profileWithPref?.notify_min_age !== undefined) {
      setNotifyMinAge(profileWithPref.notify_min_age);
    }
    if (profileWithPref?.notify_max_age !== undefined) {
      setNotifyMaxAge(profileWithPref.notify_max_age);
    }
    if (profileWithPref?.notify_same_city_only !== undefined) {
      setNotifySameCityOnly(profileWithPref.notify_same_city_only);
    }
    if (profileWithPref?.notify_summary_hour !== undefined) {
      setNotifySummaryHour(profileWithPref.notify_summary_hour);
    }
  }, [profile]);

  const handlePresenceNotificationChange = async (enabled: boolean) => {
    if (!profile?.id) return;
    
    setIsUpdatingPresenceNotif(true);
    setNotifyNewPresence(enabled);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notify_new_presence: enabled })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(enabled 
        ? "Notificaciones de nuevos perfiles activadas" 
        : "Notificaciones de nuevos perfiles desactivadas"
      );
    } catch (error) {
      console.error("Error updating presence notification preference:", error);
      setNotifyNewPresence(!enabled); // Revert on error
      toast.error("Error al actualizar preferencia");
    } finally {
      setIsUpdatingPresenceNotif(false);
    }
  };

  const handleAgeRangeChange = async (minAge: number | null, maxAge: number | null) => {
    if (!profile?.id) return;
    
    setIsUpdatingAgeRange(true);
    const prevMin = notifyMinAge;
    const prevMax = notifyMaxAge;
    setNotifyMinAge(minAge);
    setNotifyMaxAge(maxAge);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          notify_min_age: minAge,
          notify_max_age: maxAge
        })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Rango de edad actualizado");
    } catch (error) {
      console.error("Error updating age range preference:", error);
      setNotifyMinAge(prevMin);
      setNotifyMaxAge(prevMax);
      toast.error("Error al actualizar rango de edad");
    } finally {
      setIsUpdatingAgeRange(false);
    }
  };

  const handleSameCityChange = async (enabled: boolean) => {
    if (!profile?.id) return;
    
    setIsUpdatingSameCity(true);
    const prev = notifySameCityOnly;
    setNotifySameCityOnly(enabled);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notify_same_city_only: enabled })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(enabled 
        ? "Solo recibirás notificaciones de tu ciudad" 
        : "Recibirás notificaciones de todas las ciudades"
      );
    } catch (error) {
      console.error("Error updating same city preference:", error);
      setNotifySameCityOnly(prev);
      toast.error("Error al actualizar preferencia");
    } finally {
      setIsUpdatingSameCity(false);
    }
  };

  const handleSummaryHourChange = async (hour: number) => {
    if (!profile?.id) return;
    
    setIsUpdatingSummaryHour(true);
    const prev = notifySummaryHour;
    setNotifySummaryHour(hour);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notify_summary_hour: hour })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Resumen diario programado a las ${hour}:00`);
    } catch (error) {
      console.error("Error updating summary hour preference:", error);
      setNotifySummaryHour(prev);
      toast.error("Error al actualizar hora del resumen");
    } finally {
      setIsUpdatingSummaryHour(false);
    }
  };

  const handleMasterVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMasterVolumeState(newVolume);
    setMasterVolume(newVolume);
    updateMasterGainVolume();
  };

  const handleThemeSoundChange = (enabled: boolean) => {
    setThemeSoundOn(enabled);
    setThemeSoundEnabled(enabled);
  };

  const handleEnergySoundChange = (enabled: boolean) => {
    setEnergySoundOn(enabled);
    setEnergySoundEnabled(enabled);
  };

  const handleActionSoundsChange = (enabled: boolean) => {
    setActionSoundsOn(enabled);
    setActionSoundsEnabled(enabled);
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

  const sparkleStyleOptions: { value: SparkleStyle; label: string; icon: typeof Stars }[] = [
    { value: "stars", label: "Estrellas", icon: Stars },
    { value: "fire", label: "Fuego", icon: Flame },
    { value: "hearts", label: "Corazones", icon: Heart },
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
          {/* Master Volume Control */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              {masterVolume === 0 ? (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Volume2 className="w-5 h-5 text-primary" />
              )}
              <div className="flex-1">
                <span className="font-body text-sm text-foreground block">
                  Volumen general
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Controla el volumen de todos los sonidos
                </span>
              </div>
              <span className="font-body text-sm text-muted-foreground w-10 text-right">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleMasterVolumeChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

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

          {/* Sparkle Trail Effect */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Stars className={`w-5 h-5 ${sparkleTrailEnabled ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <span className="font-body text-sm text-foreground block">
                    Estela de destellos
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    Efecto visual al deslizar hacia Chispa
                  </span>
                </div>
              </div>
              <Switch
                checked={sparkleTrailEnabled}
                onCheckedChange={setSparkleTrailEnabled}
              />
            </div>
            {sparkleTrailEnabled && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                {/* Style selector */}
                <div className="flex gap-2">
                  {sparkleStyleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSparkleStyle(option.value)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-body transition-colors ${
                          sparkleStyle === option.value
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
                {/* Sound test buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playSparkleStarsSound()}
                    className="flex-1 flex items-center gap-1.5 text-xs"
                  >
                    <Stars className="w-3 h-3" />
                    <Play className="w-2.5 h-2.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playSparkleFireSound()}
                    className="flex-1 flex items-center gap-1.5 text-xs"
                  >
                    <Flame className="w-3 h-3 text-orange-500" />
                    <Play className="w-2.5 h-2.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playSparkleHeartsSound()}
                    className="flex-1 flex items-center gap-1.5 text-xs"
                  >
                    <Heart className="w-3 h-3 text-rose-500" />
                    <Play className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
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

          {/* Energy Gain Sound */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Flame className={`w-5 h-5 ${energySoundOn ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <span className="font-body text-sm text-foreground block">
                  Sonido al ganar energía
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Reproduce un ding al ganar Spark Energy
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => playEnergyGainSound()}
              >
                <Play className="w-3 h-3" />
              </Button>
              <Switch
                checked={energySoundOn}
                onCheckedChange={handleEnergySoundChange}
              />
            </div>
          </div>

          {/* Action Sounds (Swipe interactions) */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MousePointer2 className={`w-5 h-5 ${actionSoundsOn ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <span className="font-body text-sm text-foreground block">
                    Sonidos de acciones
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    Chispa, Super Chispa, Pasar
                  </span>
                </div>
              </div>
              <Switch
                checked={actionSoundsOn}
                onCheckedChange={handleActionSoundsChange}
              />
            </div>
            {actionSoundsOn && (
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playPassSound()}
                  className="flex-1 flex items-center gap-2 text-xs"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                  Pasar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playChispaSound()}
                  className="flex-1 flex items-center gap-2 text-xs"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Chispa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playSuperChispaSound()}
                  className="flex-1 flex items-center gap-2 text-xs"
                >
                  <Flame className="w-4 h-4 text-purple-500" />
                  Super
                </Button>
              </div>
            )}
          </div>

          {/* New Presence Notifications */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${notifyNewPresence ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <span className="font-body text-sm text-foreground block">
                    Notificar nuevos perfiles
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    Recibir push cuando haya gente nueva
                  </span>
                </div>
              </div>
              <Switch
                checked={notifyNewPresence}
                onCheckedChange={handlePresenceNotificationChange}
                disabled={isUpdatingPresenceNotif}
              />
            </div>
            
            {notifyNewPresence && (
              <div className="pt-3 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-muted-foreground">
                    Filtrar por edad:
                  </span>
                  {(notifyMinAge !== null || notifyMaxAge !== null) && (
                    <button
                      onClick={() => handleAgeRangeChange(null, null)}
                      disabled={isUpdatingAgeRange}
                      className="text-xs text-primary hover:underline"
                    >
                      Quitar filtro
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="font-body text-xs text-muted-foreground block mb-1">
                      Edad mínima
                    </label>
                    <select
                      value={notifyMinAge ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                        handleAgeRangeChange(value, notifyMaxAge);
                      }}
                      disabled={isUpdatingAgeRange}
                      className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-0 focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sin mínimo</option>
                      {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                        <option key={age} value={age} disabled={notifyMaxAge !== null && age > notifyMaxAge}>
                          {age} años
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-muted-foreground pt-5">–</span>
                  <div className="flex-1">
                    <label className="font-body text-xs text-muted-foreground block mb-1">
                      Edad máxima
                    </label>
                    <select
                      value={notifyMaxAge ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                        handleAgeRangeChange(notifyMinAge, value);
                      }}
                      disabled={isUpdatingAgeRange}
                      className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-0 focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sin máximo</option>
                      {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                        <option key={age} value={age} disabled={notifyMinAge !== null && age < notifyMinAge}>
                          {age} años
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {(notifyMinAge !== null || notifyMaxAge !== null) && (
                  <p className="font-body text-xs text-muted-foreground">
                    Solo recibirás notificaciones de usuarios entre{" "}
                    <span className="text-foreground font-medium">
                      {notifyMinAge ?? 18} - {notifyMaxAge ?? "80+"} años
                    </span>
                  </p>
                )}

                {/* Same city filter */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${notifySameCityOnly ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <span className="font-body text-sm text-foreground block">
                        Solo mi ciudad
                      </span>
                      <span className="font-body text-xs text-muted-foreground">
                        {profile?.city ? `Solo usuarios de ${profile.city}` : "Configura tu ciudad en el perfil"}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={notifySameCityOnly}
                    onCheckedChange={handleSameCityChange}
                    disabled={isUpdatingSameCity || !profile?.city}
                  />
                </div>

                {/* Summary hour selector */}
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-sm text-foreground">
                      Hora del resumen diario
                    </span>
                  </div>
                  <select
                    value={notifySummaryHour}
                    onChange={(e) => handleSummaryHourChange(parseInt(e.target.value))}
                    disabled={isUpdatingSummaryHour}
                    className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-0 focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 {i < 12 ? '(mañana)' : i < 18 ? '(tarde)' : '(noche)'}
                      </option>
                    ))}
                  </select>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Recibirás un resumen diario a las {notifySummaryHour.toString().padStart(2, '0')}:00 UTC
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sound Test Section */}
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-foreground" />
              <div>
                <span className="font-body text-sm text-foreground block">
                  Probar sonidos de notificación
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Escucha cada sonido antes de recibir una notificación real
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => notifyUser("spark")}
                className="flex items-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                Chispa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => notifyUser("message")}
                className="flex items-center gap-2 text-xs"
              >
                <MessageCircle className="w-4 h-4 text-primary" />
                Mensaje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => notifyUser("quedada")}
                className="flex items-center gap-2 text-xs"
              >
                <Calendar className="w-4 h-4 text-accent" />
                Quedada
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => notifyUser("ghost")}
                className="flex items-center gap-2 text-xs"
              >
                <Ghost className="w-4 h-4 text-muted-foreground" />
                Ghost
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => notifyUser("connection")}
                className="flex items-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                Conexión
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => notifyUser("default")}
                className="flex items-center gap-2 text-xs"
              >
                <Play className="w-4 h-4 text-muted-foreground" />
                General
              </Button>
            </div>
          </div>

          {/* Reset Gesture Guide */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Hand className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-body text-sm text-foreground block">
                  Guía de gestos táctiles
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Resetea para ver la guía otra vez
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("kiki_crop_gesture_guide_shown");
                toast.success("Guía reseteada", {
                  description: "Verás la guía la próxima vez que edites una imagen"
                });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
            >
              Resetear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettingsSection;
