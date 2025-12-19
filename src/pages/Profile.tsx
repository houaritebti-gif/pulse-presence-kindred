import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera } from "lucide-react";

const VIBES = ["Tranqui", "Intensa", "Curiosa", "Misteriosa", "Libre"];
const TRIBES = ["Queer", "Artista", "Nómada", "Foodie", "Noctámbula", "Indie"];

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);

  const toggleTribe = (tribe: string) => {
    setSelectedTribes(prev => 
      prev.includes(tribe) 
        ? prev.filter(t => t !== tribe)
        : [...prev, tribe]
    );
  };

  const handleContinue = () => {
    navigate("/presence");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate("/auth")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

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
            onChange={(e) => setName(e.target.value)}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Input
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
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
                onClick={() => setSelectedVibe(vibe)}
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
          >
            Continuar
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Profile;
