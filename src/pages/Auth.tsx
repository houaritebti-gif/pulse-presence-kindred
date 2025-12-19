import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: just navigate to profile
    navigate("/profile");
  };

  const handleGoogleAuth = () => {
    // Demo: just navigate to profile
    navigate("/profile");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            {isLogin ? "Hola de nuevo" : "Únete"}
          </h1>
          <p className="font-body text-muted-foreground">
            {isLogin ? "Te echábamos de menos." : "Bienvenida al club."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 animate-fade-up animate-delay-200">
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
            />
            <Input
              type="password"
              placeholder="contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
            />
          </div>

          <Button 
            type="submit" 
            variant="kiki" 
            size="lg" 
            className="w-full mt-6"
          >
            {isLogin ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full my-8 animate-fade-up animate-delay-300">
          <div className="flex-1 h-px bg-border" />
          <span className="font-body text-sm text-muted-foreground">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google */}
        <Button 
          variant="kiki-soft" 
          size="lg" 
          className="w-full animate-fade-up animate-delay-300"
          onClick={handleGoogleAuth}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </Button>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="mt-8 font-body text-sm text-muted-foreground hover:text-foreground transition-colors animate-fade-up animate-delay-400"
        >
          {isLogin ? "¿Primera vez? Crear cuenta" : "¿Ya tienes cuenta? Entrar"}
        </button>
      </div>
    </main>
  );
};

export default Auth;
