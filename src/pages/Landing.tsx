import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-lg w-full text-center space-y-12">
        {/* Logo */}
        <div className="animate-fade-up">
          <h1 className="font-display text-7xl md:text-8xl font-bold tracking-tight text-foreground">
            KIKI
          </h1>
        </div>

        {/* Tagline */}
        <div className="animate-fade-up animate-delay-200 space-y-4">
          <p className="font-display text-2xl md:text-3xl font-medium text-foreground/90 leading-relaxed">
            aquí no hay match,
          </p>
          <p className="font-display text-2xl md:text-3xl font-medium text-primary leading-relaxed">
            hay chispa.
          </p>
        </div>

        {/* Subtle description */}
        <p className="animate-fade-up animate-delay-300 font-body text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Un espacio para conectar sin presión. Sin algoritmos. Sin ruido.
        </p>

        {/* CTA */}
        <div className="animate-fade-up animate-delay-400 pt-6">
          <Button 
            variant="kiki" 
            size="xl"
            onClick={() => navigate("/auth")}
            className="w-full max-w-xs"
          >
            Entrar
          </Button>
        </div>

        {/* Footer note */}
        <p className="animate-fade-up animate-delay-500 font-body text-sm text-muted-foreground/60">
          Solo para quienes entienden.
        </p>
      </div>
    </main>
  );
};

export default Landing;
