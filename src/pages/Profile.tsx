import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useProfileTribes, useUpdateProfile, useUpdateTribes } from "@/hooks/useProfile";
import { toast } from "sonner";

const VIBES = ["Tranqui", "Intensa", "Curiosa", "Misteriosa", "Libre"];
const TRIBES = ["Queer", "Artista", "Nómada", "Foodie", "Noctámbula", "Indie"];

const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: tribes } = useProfileTribes(profile?.id);
  const updateProfile = useUpdateProfile();
  const updateTribes = useUpdateTribes();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCity(profile.city || "Madrid");
      setSelectedVibe(profile.vibe);
    }
  }, [profile]);

  useEffect(() => {
    if (tribes) {
      setSelectedTribes(tribes.map(t => t.tribe));
    }
  }, [tribes]);

  const toggleTribe = (tribe: string) => {
    setHasChanges(true);
    setSelectedTribes(prev => 
      prev.includes(tribe) 
        ? prev.filter(t => t !== tribe)
        : [...prev, tribe]
    );
  };

  const handleContinue = async () => {
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        name: name || null,
        city: city || "Madrid",
        vibe: selectedVibe,
      });

      await updateTribes.mutateAsync({
        profileId: profile.id,
        tribes: selectedTribes,
      });

      toast.success("Perfil guardado");
      navigate("/presence");
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Presencia</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <LogOut className="w-4 h-4" />
          <span>Salir</span>
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Tu perfil
          </h1>
          <p className="font-body text-muted-foreground text-sm">
            Solo lo esencial. Nada más.
          </p>
        </div>

        {/* Photo */}
        <div className="flex justify-center mb-10 animate-fade-up animate-delay-100">
          <button className="relative w-32 h-32 rounded-full bg-card flex items-center justify-center group transition-transform hover:scale-105">
            <Camera className="w-8 h-8 text-card-foreground/60 group-hover:text-card-foreground transition-colors" />
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-card-foreground/20 group-hover:border-card-foreground/40 transition-colors" />
          </button>
        </div>

        {/* Name & City */}
        <div className="space-y-4 mb-10 animate-fade-up animate-delay-200">
          <Input
            type="text"
            placeholder="Tu nombre (o como quieras que te llamen)"
            value={name}
            onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Input
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={(e) => { setCity(e.target.value); setHasChanges(true); }}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
        </div>

        {/* Vibe */}
        <div className="mb-10 animate-fade-up animate-delay-300">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Tu vibra
          </h2>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(vibe => (
              <button
                key={vibe}
                onClick={() => { setSelectedVibe(vibe); setHasChanges(true); }}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  selectedVibe === vibe
                    ? "bg-card text-card-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Tribes */}
        <div className="mb-12 animate-fade-up animate-delay-400">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Tus tribus
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRIBES.map(tribe => (
              <button
                key={tribe}
                onClick={() => toggleTribe(tribe)}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  selectedTribes.includes(tribe)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {tribe}
              </button>
            ))}
          </div>
        </div>

        {/* Continue */}
        <div className="animate-fade-up animate-delay-500">
          <Button 
            variant="kiki" 
            size="lg" 
            className="w-full"
            onClick={handleContinue}
            disabled={updateProfile.isPending || updateTribes.isPending}
          >
            {updateProfile.isPending ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Profile;
