import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse-soft" />
        
        {/* Floating accent orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-2/3 left-1/3 w-24 h-24 bg-primary/15 rounded-full blur-xl animate-float" style={{ animationDelay: "4s" }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>
      
      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Flame icon with glow */}
        <div className="animate-fade-up flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150 animate-pulse-soft" />
            <Flame className="relative w-16 h-16 md:w-20 md:h-20 text-primary animate-spark-flame" />
          </div>
        </div>

        {/* Logo with dramatic typography */}
        <div className="animate-fade-up animate-delay-100">
          <h1 className="font-display text-8xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter text-foreground leading-none">
            KIKI
          </h1>
        </div>

        {/* Tagline with emphasis */}
        <div className="animate-fade-up animate-delay-200 space-y-2">
          <p className="font-display text-xl md:text-2xl lg:text-3xl font-medium text-foreground/80 leading-relaxed">
            aquí no hay match,
          </p>
          <p className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed relative inline-block">
            <span className="gradient-text">hay chispa.</span>
            <Sparkles className="absolute -right-8 -top-2 w-5 h-5 text-primary animate-pulse-soft" />
          </p>
        </div>

        {/* Feature highlights */}
        <div className="animate-fade-up animate-delay-300 flex flex-wrap justify-center gap-4 pt-4">
          <div className="px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/20">
            <span className="font-body text-sm text-card-foreground/80">Sin algoritmos</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/20">
            <span className="font-body text-sm text-card-foreground/80">Sin presión</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/20">
            <span className="font-body text-sm text-card-foreground/80">Sin ruido</span>
          </div>
        </div>

        {/* Subtle description */}
        <p className="animate-fade-up animate-delay-400 font-body text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          Un espacio para quienes buscan conexiones reales, no likes.
        </p>

        {/* CTA with glow effect */}
        <div className="animate-fade-up animate-delay-500 pt-8">
          <Button 
            variant="kiki" 
            size="xl"
            onClick={() => navigate("/auth")}
            className="w-full max-w-xs relative group overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 group-hover:animate-spark-flame" />
              Entrar
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundPosition: "0% 0%", animation: "shimmer 3s ease-in-out infinite" }} />
          </Button>
        </div>

        {/* Footer note with style */}
        <p className="animate-fade-up animate-delay-500 font-body text-sm text-muted-foreground/50 italic pt-4">
          Solo para quienes entienden.
        </p>
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </main>
  );
};

export default Landing;
