import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, X, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { KikiLogo } from "@/components/KikiLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { usePasswordBreachCheck } from "@/hooks/usePasswordBreachCheck";

const passwordSchema = z.string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Al menos una mayúscula")
  .regex(/[0-9]/, "Al menos un número")
  .regex(/[^A-Za-z0-9]/, "Al menos un símbolo (!@#$%...)");

const passwordRequirements = [
  { label: "8+ caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Un símbolo", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const getPasswordStrength = (password: string) => {
  const passed = passwordRequirements.filter(req => req.test(password)).length;
  const percentage = (passed / passwordRequirements.length) * 100;
  
  if (passed === 0) return { level: "none", label: "", color: "bg-muted", percentage: 0 };
  if (passed === 1) return { level: "weak", label: "Débil", color: "bg-destructive", percentage };
  if (passed === 2) return { level: "fair", label: "Regular", color: "bg-orange-500", percentage };
  if (passed === 3) return { level: "good", label: "Buena", color: "bg-yellow-500", percentage };
  return { level: "strong", label: "Fuerte", color: "bg-green-500", percentage };
};

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [breachChecked, setBreachChecked] = useState(false);
  
  const { 
    checkPassword, 
    isChecking: isCheckingBreach, 
    breachCount, 
    isBreached,
    reset: resetBreachCheck 
  } = usePasswordBreachCheck();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/presence");
    }
  }, [user, navigate]);

  // Debounced breach check when password changes
  useEffect(() => {
    if (isLogin || password.length < 8) {
      resetBreachCheck();
      setBreachChecked(false);
      return;
    }

    const timer = setTimeout(async () => {
      await checkPassword(password);
      setBreachChecked(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [password, isLogin, checkPassword, resetBreachCheck]);

  const validatePassword = (pwd: string): boolean => {
    const result = passwordSchema.safeParse(pwd);
    if (!result.success) {
      setPasswordError(result.error.errors[0].message);
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate password strength on signup
    if (!isLogin && !validatePassword(password)) {
      return;
    }

    // Block signup with breached passwords
    if (!isLogin && isBreached) {
      toast.error("Esta contraseña ha sido filtrada. Por favor, elige otra.");
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("¡Bienvenida de vuelta!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Ya puedes entrar.");
      }
      navigate("/presence");
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email o contraseña incorrectos");
      } else if (error.message.includes("already registered")) {
        toast.error("Este email ya está registrado");
      } else {
        toast.error(error.message || "Error de autenticación");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/presence`,
      },
    });
    if (error) {
      toast.error("Error con Google: " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-[300px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header with back button and logo */}
      <div className="relative z-10 flex items-center justify-between max-w-lg mx-auto w-full mb-10">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 group rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver</span>
        </button>
        <KikiLogo size="md" />
        <div className="w-20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            {isLogin ? "Hola de nuevo" : "Únete"}
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
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
              required
              className="h-14 text-base bg-secondary/50 border-border/50 focus:border-primary"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
            <Input
              type="password"
              placeholder="contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!isLogin) setPasswordError(null);
              }}
              required
              className="h-14 text-base bg-secondary/50 border-border/50 focus:border-primary"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
            
            {/* Password strength indicator - only show on signup */}
            {!isLogin && password.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                {/* Strength bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>Seguridad</span>
                    <span className={`text-xs font-medium ${
                      getPasswordStrength(password).level === "strong" ? "text-green-500" :
                      getPasswordStrength(password).level === "good" ? "text-yellow-500" :
                      getPasswordStrength(password).level === "fair" ? "text-orange-500" :
                      getPasswordStrength(password).level === "weak" ? "text-destructive" : "text-muted-foreground"
                    }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ease-out ${getPasswordStrength(password).color}`}
                      style={{ width: `${getPasswordStrength(password).percentage}%` }}
                    />
                  </div>
                </div>
                
                {/* Requirements checklist */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-secondary/30">
                  {passwordRequirements.map((req) => {
                    const passed = req.test(password);
                    return (
                      <div 
                        key={req.label}
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          passed ? "text-green-500" : "text-muted-foreground"
                        }`}
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      >
                        {passed ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        {req.label}
                      </div>
                    );
                  })}
                </div>

                {/* Breach check indicator */}
                {password.length >= 8 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    {isCheckingBreach ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
                          Verificando filtraciones...
                        </span>
                      </>
                    ) : isBreached ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-destructive" style={{ fontFamily: 'Arial, sans-serif' }}>
                          ⚠️ Filtrada {breachCount?.toLocaleString()} veces. Elige otra.
                        </span>
                      </>
                    ) : breachChecked ? (
                      <>
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500" style={{ fontFamily: 'Arial, sans-serif' }}>
                          No encontrada en filtraciones conocidas
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}
            
            {passwordError && !isLogin && (
              <p className="text-xs text-destructive animate-fade-in" style={{ fontFamily: 'Arial, sans-serif' }}>
                {passwordError}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="kiki" 
            size="lg" 
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? "..." : isLogin ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full my-8 animate-fade-up animate-delay-300">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>o</span>
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
          className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors animate-fade-up animate-delay-400"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {isLogin ? "¿Primera vez? Crear cuenta" : "¿Ya tienes cuenta? Entrar"}
        </button>
      </div>
    </main>
  );
};

export default Auth;
