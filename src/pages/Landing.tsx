import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { KikiLogo } from "@/components/KikiLogo";
import { Sparkles, Heart, Users, Shield } from "lucide-react";
import LandingFooter from "@/components/LandingFooter";

// Floating particles component
const FloatingParticle = ({ delay, duration, size, left, top }: { 
  delay: number; 
  duration: number; 
  size: number; 
  left: string; 
  top: string;
}) => (
  <motion.div
    className="absolute rounded-full bg-white/40 pointer-events-none"
    style={{ width: size, height: size, left, top }}
    initial={{ opacity: 0, y: 0 }}
    animate={{ 
      opacity: [0, 0.6, 0],
      y: [-20, -80],
      x: [0, Math.random() * 30 - 15]
    }}
    transition={{ 
      duration,
      delay,
      repeat: Infinity,
      ease: "easeOut"
    }}
  />
);

// Feature pill component
const FeaturePill = ({ icon: Icon, text, delay }: { 
  icon: React.ElementType; 
  text: string; 
  delay: number;
}) => (
  <motion.div
    className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/40 shadow-sm"
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.8)' }}
  >
    <Icon className="w-4 h-4 text-kiki-red-warm" />
    <span className="text-xs md:text-sm font-medium text-kiki-black/80">{text}</span>
  </motion.div>
);

const Landing = () => {
  const navigate = useNavigate();

  // Generate floating particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 2,
    size: 4 + Math.random() * 8,
    left: `${Math.random() * 100}%`,
    top: `${50 + Math.random() * 40}%`
  }));

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col relative overflow-hidden bg-kiki-pink-bubble">
      {/* Layered gradient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-kiki-pink-bubble/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/10 pointer-events-none" />
      
      {/* Ambient orbs */}
      <motion.div 
        className="absolute top-[10%] left-[5%] w-64 h-64 md:w-96 md:h-96 rounded-full pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[20%] right-[5%] w-48 h-48 md:w-72 md:h-72 rounded-full pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, hsl(var(--kiki-red-warm) / 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }}
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
          y: [0, -20, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Floating particles */}
      {particles.map((p) => (
        <FloatingParticle key={p.id} {...p} />
      ))}
      
      {/* Main content - centered with proper spacing */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-20">
        <motion.div 
          className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo KIKI - Dramatic entrance animation with glow */}
          <motion.div 
            className="relative mb-8 md:mb-10"
            initial={{ opacity: 0, scale: 0.3, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.9, 
              delay: 0.1,
              type: "spring", 
              stiffness: 120,
              damping: 12
            }}
          >
            {/* Outer glow - larger and more subtle */}
            <motion.div 
              className="absolute -inset-x-32 -inset-y-20 rounded-full pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 60%)',
                filter: 'blur(60px)'
              }}
              animate={{ 
                opacity: [0.2, 0.45, 0.2],
                scale: [0.95, 1.2, 0.95]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Inner glow - smaller and more vibrant */}
            <motion.div 
              className="absolute -inset-x-16 -inset-y-10 rounded-full pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
                filter: 'blur(35px)'
              }}
              animate={{ 
                opacity: [0.35, 0.7, 0.35],
                scale: [0.9, 1.15, 0.9]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              className="relative z-10"
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <KikiLogo size="hero" variant="dark" />
            </motion.div>
          </motion.div>
          
          {/* Taglines - Enhanced visual */}
          <div className="flex flex-col items-center gap-4 mb-10 md:mb-12">
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl text-kiki-black font-display font-bold tracking-tight leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ 
                textShadow: '1px 2px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              Para gente <span className="text-kiki-black font-black">diferente</span>, y punto.
            </motion.h1>
            
            {/* Secondary tagline - refined visual */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-kiki-black/65 tracking-wide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              aquí no hay match, hay{' '}
              <motion.span 
                className="text-kiki-red-warm font-bold relative inline-block"
                animate={{ 
                  textShadow: [
                    '0 0 0px hsl(var(--kiki-red-warm) / 0)',
                    '0 0 12px hsl(var(--kiki-red-warm) / 0.5)',
                    '0 0 0px hsl(var(--kiki-red-warm) / 0)'
                  ]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                chispa
                <motion.span
                  className="absolute -right-5 -top-1 text-lg"
                  animate={{ 
                    scale: [1, 1.25, 1],
                    opacity: [0.8, 1, 0.8],
                    rotate: [0, 12, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ✨
                </motion.span>
              </motion.span>
            </motion.p>
          </div>

          {/* Feature pills - visual value props */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10 md:mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <FeaturePill icon={Heart} text="Conexiones reales" delay={1.0} />
            <FeaturePill icon={Shield} text="Privacidad primero" delay={1.1} />
            <FeaturePill icon={Users} text="Comunidad LGBTQ+" delay={1.2} />
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col items-center gap-5 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            {/* Button with border shimmer effect */}
            <div className="relative w-full group">
              {/* Animated border glow */}
              <motion.div 
                className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--kiki-red-warm)), transparent)',
                  backgroundSize: '200% 100%'
                }}
                animate={{
                  backgroundPosition: ['200% 0', '-200% 0']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Shimmer sweep overlay */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <motion.div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                    width: '50%'
                  }}
                  animate={{
                    x: ['-100%', '300%']
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 1.5
                  }}
                />
              </div>
              
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="relative w-full h-14 md:h-16 text-base md:text-lg font-bold bg-kiki-black text-white hover:bg-kiki-black/90 rounded-2xl shadow-xl shadow-kiki-black/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
              >
                <span>ÚNETE AHORA</span>
                <motion.span
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                </motion.span>
              </Button>
            </div>
            
            <motion.button
              onClick={() => navigate("/auth?mode=login")}
              className="group flex items-center gap-2 text-sm md:text-base text-kiki-black/70 hover:text-kiki-black font-medium transition-all duration-300 py-3 px-5 rounded-full hover:bg-white/50 backdrop-blur-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>¿Ya tienes cuenta?</span>
              <span className="font-semibold underline underline-offset-4 decoration-2 decoration-primary/60 group-hover:decoration-primary transition-colors">
                Inicia Sesión
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Footer minimalista - proper spacing from content */}
      <div className="relative z-10 pb-safe">
        <LandingFooter />
      </div>
    </div>
  );
};

export default Landing;
