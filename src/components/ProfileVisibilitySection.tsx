import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Eye, EyeOff, MapPin, Calendar, Sparkles, Music, Heart, Star, Palette, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { triggerHaptic } from "@/utils/haptics";

interface VisibilitySettings {
  show_birth_year: boolean;
  show_zodiac: boolean;
  show_gender: boolean;
  show_city: boolean;
  show_vibe: boolean;
  show_tribes: boolean;
  show_music_styles: boolean;
  show_interests: boolean;
  show_looking_for: boolean;
  show_aesthetic_details: boolean;
}

const VISIBILITY_OPTIONS = [
  { key: "show_zodiac", label: "Signo zodiacal", icon: Star, description: "Tu signo según tu fecha de nacimiento" },
  { key: "show_birth_year", label: "Año de nacimiento", icon: Calendar, description: "El año en que naciste" },
  { key: "show_gender", label: "Género", icon: Users, description: "Tu identidad de género" },
  { key: "show_city", label: "Ciudad", icon: MapPin, description: "Tu ubicación" },
  { key: "show_vibe", label: "Vibe", icon: Sparkles, description: "Tu vibra actual" },
  { key: "show_tribes", label: "Tribus", icon: Users, description: "Tus comunidades musicales" },
  { key: "show_music_styles", label: "Estilos musicales", icon: Music, description: "Tus géneros favoritos" },
  { key: "show_interests", label: "Intereses", icon: Heart, description: "Tus intereses culturales" },
  { key: "show_looking_for", label: "Qué buscas", icon: Heart, description: "Lo que buscas en KIKI" },
  { key: "show_aesthetic_details", label: "Detalles estéticos", icon: Palette, description: "Tatuajes, piercings, estilo..." },
] as const;

const ProfileVisibilitySection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<VisibilitySettings>({
    show_birth_year: true,
    show_zodiac: true,
    show_gender: true,
    show_city: true,
    show_vibe: true,
    show_tribes: true,
    show_music_styles: true,
    show_interests: true,
    show_looking_for: true,
    show_aesthetic_details: true,
  });

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("show_birth_year, show_zodiac, show_gender, show_city, show_vibe, show_tribes, show_music_styles, show_interests, show_looking_for, show_aesthetic_details")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings({
            show_birth_year: data.show_birth_year ?? true,
            show_zodiac: data.show_zodiac ?? true,
            show_gender: data.show_gender ?? true,
            show_city: data.show_city ?? true,
            show_vibe: data.show_vibe ?? true,
            show_tribes: data.show_tribes ?? true,
            show_music_styles: data.show_music_styles ?? true,
            show_interests: data.show_interests ?? true,
            show_looking_for: data.show_looking_for ?? true,
            show_aesthetic_details: data.show_aesthetic_details ?? true,
          });
        }
      } catch (error) {
        console.error("Error loading visibility settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleToggle = async (key: keyof VisibilitySettings, value: boolean) => {
    if (!user) return;
    
    const previousValue = settings[key];
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    triggerHaptic("light");
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;

      // Invalidate profile query to keep in sync
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error) {
      // Rollback on error
      setSettings(prev => ({ ...prev, [key]: previousValue }));
      toast.error("Error al guardar preferencia");
      console.error("Error updating visibility:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="mb-6 opacity-0 animate-fade-up" style={{ animationDelay: "525ms", animationFillMode: "forwards" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          {enabledCount === VISIBILITY_OPTIONS.length ? (
            <Eye className="w-5 h-5 text-primary" />
          ) : (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          )}
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Arial Black, Arial, sans-serif" }}>
            Visibilidad del perfil
          </h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
            {enabledCount}/{VISIBILITY_OPTIONS.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 animate-fade-up">
          <p className="text-xs text-muted-foreground mb-4 font-body">
            Controla qué información es visible en tu perfil público
          </p>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-secondary/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map(option => {
                const Icon = option.icon;
                const isEnabled = settings[option.key];
                
                return (
                  <div
                    key={option.key}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      isEnabled ? "bg-secondary/50" : "bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <span className={`font-body text-sm block ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {option.label}
                        </span>
                        <span className="font-body text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(option.key, checked)}
                      disabled={isSaving}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileVisibilitySection;
