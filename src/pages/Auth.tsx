import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, X, AlertTriangle, Shield, Loader2, Mail, Lock, Sparkles, Heart, Users, MessageCircle } from "lucide-react";
import { KikiLogo } from "@/components/KikiLogo";
import { FloatingParticles } from "@/components/FloatingParticles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { usePasswordBreachCheck } from "@/hooks/usePasswordBreachCheck";
import { fireWelcomeConfetti } from "@/utils/sparkConfetti";
import { triggerHaptic } from "@/utils/haptics";

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

// Feature benefits for the auth page
const benefits = [
  { icon: Heart, label: "Conexiones reales", color: "text-primary" },
  { icon: Users, label: "Comunidad diversa", color: "text-accent" },
  { icon: MessageCircle, label: "Sin presión", color: "text-primary" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [breachChecked, setBreachChecked] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  
  const { 
    checkPassword, 
    isChecking: isCheckingBreach, 
    breachCount, 
    isBreached,
    reset: resetBreachCheck 
  } = usePasswordBreachCheck();

  // Wait for auth state to be ready before showing form
  useEffect(() => {
    if (!authLoading) {
      // Small delay to prevent flash of form before redirect
      const timer = setTimeout(() => {
        setAuthReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/presence", { replace: true });
    }
  }, [user, authLoading, navigate]);

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
        
        // 🎉 Celebrate new user signup!
        fireWelcomeConfetti();
        triggerHaptic('success');
        toast.success("🎉 ¡Bienvenida a KIKI! Tu cuenta está lista.");
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

  // Show loading while auth state is being determined
  if (authLoading || !authReady) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // If user is already logged in, show nothing (redirect will happen)
  if (user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
      {/* Animated ambient glow - enhanced */}
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/20 blur-[180px] rounded-full pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/15 blur-[150px] rounded-full pointer-events-none"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.25, 0.15],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div 
        className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-primary/12 blur-[130px] rounded-full pointer-events-none"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Header with grid centering - matching PageHeader pattern */}
      <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 max-w-lg mx-auto w-full mb-6 sm:mb-8">
        {/* Left section - back button */}
        <motion.div 
          className="flex items-center justify-start"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 group rounded-lg p-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ fontFamily: 'Arial, sans-serif' }}
            aria-label="Volver a inicio"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base">Volver</span>
          </button>
        </motion.div>

        {/* Center section - Logo with entrance animation */}
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.175, 0.885, 0.32, 1.1],
            delay: 0.05
          }}
        >
          <KikiLogo size="lg" />
        </motion.div>

        {/* Right section - theme toggle */}
        <motion.div 
          className="flex items-center justify-end"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ThemeToggle />
        </motion.div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        {/* Floating particles around content */}
        <div className="absolute -inset-20 pointer-events-none">
          <FloatingParticles count={20} />
        </div>
        
        {/* Header text with enhanced animation */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <motion.div
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h1 
              className="text-3xl sm:text-4xl font-bold text-foreground mb-3" 
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              {isLogin ? "Hola de nuevo" : "Únete a KIKI"}
            </h1>
            <p 
              className="text-foreground/70 text-base sm:text-lg" 
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {isLogin ? "Te echábamos de menos ✨" : "Tu espacio seguro te espera."}
            </p>
          </motion.div>
        </motion.div>

        {/* Benefits pills - only on signup */}
        {!isLogin && (
          <motion.div 
            className="flex flex-wrap justify-center gap-2 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/50 shadow-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <benefit.icon className={`w-3.5 h-3.5 ${benefit.color}`} />
                <span className="text-xs font-medium text-foreground/80" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {benefit.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Form with enhanced styling */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="w-full space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="space-y-4">
            {/* Email field with icon */}
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <Mail className="w-5 h-5" />
              </div>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                className="h-14 pl-12 text-base bg-card/60 border-border/60 focus:border-primary focus:bg-card shadow-sm transition-all duration-200"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
            </div>
            
            {/* Password field with icon */}
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!isLogin) setPasswordError(null);
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                className="h-14 pl-12 text-base bg-card/60 border-border/60 focus:border-primary focus:bg-card shadow-sm transition-all duration-200"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
            </div>
            
            {/* Password strength indicator - only show on signup */}
            {!isLogin && password.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Strength bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-foreground/60" style={{ fontFamily: 'Arial, sans-serif' }}>Seguridad</span>
                    <span className={`text-xs font-medium ${
                      getPasswordStrength(password).level === "strong" ? "text-green-500" :
                      getPasswordStrength(password).level === "good" ? "text-yellow-500" :
                      getPasswordStrength(password).level === "fair" ? "text-orange-500" :
                      getPasswordStrength(password).level === "weak" ? "text-destructive" : "text-muted-foreground"
                    }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className={`h-full rounded-full ${getPasswordStrength(password).color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${getPasswordStrength(password).percentage}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                {/* Requirements checklist with enhanced styling */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-card/50 border border-border/30 shadow-sm">
                  {passwordRequirements.map((req) => {
                    const passed = req.test(password);
                    return (
                      <motion.div 
                        key={req.label}
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          passed ? "text-green-500" : "text-foreground/50"
                        }`}
                        style={{ fontFamily: 'Arial, sans-serif' }}
                        initial={false}
                        animate={{ scale: passed ? [1, 1.05, 1] : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {passed ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        {req.label}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Breach check indicator */}
                {password.length >= 8 && (
                  <motion.div 
                    className="flex items-center gap-2 p-3 rounded-xl bg-card/50 border border-border/30 shadow-sm"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isCheckingBreach ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-foreground/60" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                          ✓ No encontrada en filtraciones conocidas
                        </span>
                      </>
                    ) : null}
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {passwordError && !isLogin && (
              <motion.p 
                className="text-xs text-destructive" 
                style={{ fontFamily: 'Arial, sans-serif' }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {passwordError}
              </motion.p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="kiki" 
            size="lg" 
            className="w-full mt-6 h-14 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {isLogin ? "Entrar" : "Crear cuenta"}
              </>
            )}
          </Button>
        </motion.form>

        {/* Divider with enhanced styling */}
        <motion.div 
          className="flex items-center gap-4 w-full my-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-sm text-foreground/50 px-2" style={{ fontFamily: 'Arial, sans-serif' }}>o</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </motion.div>

        {/* Google button with enhanced styling */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Button 
            variant="kiki-soft" 
            size="lg" 
            className="w-full h-14 shadow-md hover:shadow-lg transition-all duration-300"
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
        </motion.div>

        {/* Toggle with enhanced styling */}
        <motion.button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="mt-8 text-sm text-foreground/60 hover:text-foreground transition-all duration-300 hover:scale-105"
          style={{ fontFamily: 'Arial, sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLogin ? (
            <>¿Primera vez? <span className="text-primary font-semibold">Crear cuenta</span></>
          ) : (
            <>¿Ya tienes cuenta? <span className="text-primary font-semibold">Entrar</span></>
          )}
        </motion.button>

        {/* Decorative sparkle */}
        <motion.div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Sparkles className="w-5 h-5 text-primary/30" />
        </motion.div>
      </div>
    </main>
  );
};

export default Auth;
