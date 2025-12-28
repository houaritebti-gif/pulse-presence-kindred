import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, MessageCircle, Zap, Eye, Shield, Star, Quote } from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, type Variants } from "framer-motion";
import Footer from "@/components/Footer";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import FAQSection from "@/components/FAQSection";
import { useRef, useEffect, useState } from "react";

const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 60
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const staggerContainer: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [-20, -100, -20],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated text with letter-by-letter reveal
const AnimatedTitle = ({ text, className }: { text: string; className?: string }) => {
  return (
    <motion.h1 
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.05,
          }
        }
      }}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { 
              opacity: 0, 
              y: 50,
              rotateX: -90,
            },
            visible: { 
              opacity: 1, 
              y: 0,
              rotateX: 0,
              transition: {
                type: "spring",
                damping: 12,
                stiffness: 200,
              }
            }
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// Mouse follower effect
const MouseFollower = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 150);
      cursorY.set(e.clientY - 150);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed w-[300px] h-[300px] rounded-full pointer-events-none z-0 hidden md:block"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
      }}
    />
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const features = [
    {
      icon: Eye,
      title: "Sin algoritmos",
      description: "Nadie decide por ti quién deberías conocer. Tú eliges.",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Heart,
      title: "Chispas reales",
      description: "Conexiones que nacen de la curiosidad, no de un swipe.",
      gradient: "from-rose-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Tu espacio",
      description: "Controla tu visibilidad. Aparece cuando quieras.",
      gradient: "from-fuchsia-500 to-pink-500",
    },
    {
      icon: MessageCircle,
      title: "Conversaciones",
      description: "Habla primero, juzga después. Sin fotos obligatorias.",
      gradient: "from-purple-500 to-fuchsia-500",
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Enciende tu presencia",
      description: "Cuando estés disponible, activa tu llama. Los demás sabrán que estás ahí.",
      icon: Zap,
    },
    {
      step: "02",
      title: "Explora perfiles",
      description: "Descubre personas por su vibe, no por su foto. Lee entre líneas.",
      icon: Eye,
    },
    {
      step: "03",
      title: "Lanza una chispa",
      description: "Si algo te llama la atención, envía una chispa. Si es mutua, nace la conversación.",
      icon: Sparkles,
    }
  ];

  const quotes = [
    "Las mejores conexiones no se fuerzan.",
    "Aquí no hay matches, hay momentos.",
    "Menos ruido, más chispa."
  ];

  const testimonials = [
    {
      name: "Lucía M.",
      age: 26,
      city: "Madrid",
      text: "Por fin una app donde puedo ser yo misma sin la presión de las fotos perfectas. Aquí las conversaciones fluyen de verdad.",
      avatar: "🦋",
    },
    {
      name: "Carlos R.",
      age: 29,
      city: "Barcelona",
      text: "Llevaba años cansado de hacer swipe sin sentido. En KIKI conocí personas que realmente conectan con mi vibe.",
      avatar: "🎸",
    },
    {
      name: "Marina P.",
      age: 24,
      city: "Valencia",
      text: "La función de presencia es genial. Solo aparezco cuando tengo ganas de conocer gente, sin presiones.",
      avatar: "🌙",
    },
    {
      name: "Álex G.",
      age: 31,
      city: "Sevilla",
      text: "Lo que más me gusta es que aquí la gente es auténtica. Nada de filtros ni poses. Solo chispa real.",
      avatar: "⚡",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden relative">
      <MouseFollower />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <FloatingParticles />
        
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 overflow-hidden pointer-events-none" 
          style={{ y: backgroundY }}
        >
          {/* Main gradient orb with morphing animation */}
          <motion.div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-morph"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.05) 50%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Animated rings */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10"
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/20"
            animate={{ rotate: -360, scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Floating accent orbs with enhanced animations */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/15 rounded-full blur-2xl"
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/15 rounded-full blur-2xl"
            animate={{
              y: [0, 40, 0],
              x: [0, -30, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-2/3 left-1/3 w-24 h-24 bg-primary/20 rounded-full blur-xl"
            animate={{
              y: [0, -50, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </motion.div>
        
        <motion.div 
          className="relative z-10 max-w-2xl w-full text-center space-y-8" 
          style={{ opacity, scale }}
        >
          {/* Flame icon with enhanced glow */}
          <motion.div 
            className="flex justify-center" 
            initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut", type: "spring" }}
          >
            <div className="relative">
              <motion.div 
                className="absolute inset-0 bg-primary/40 blur-3xl rounded-full scale-150"
                animate={{ 
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1.5, 2, 1.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <Heart className="relative w-16 h-16 md:w-20 md:h-20 text-primary fill-primary animate-heartbeat drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]" />
            </div>
          </motion.div>

          {/* Logo with dramatic typography - letter by letter animation */}
          <AnimatedTitle 
            text="KIKI"
            className="font-display text-8xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter text-foreground leading-none glow-text"
          />

          {/* Tagline with emphasis */}
          <motion.div 
            className="space-y-2" 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <motion.p 
              className="font-display text-xl md:text-2xl lg:text-3xl font-medium text-foreground/80 leading-relaxed"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              aquí no hay match,
            </motion.p>
            <motion.p 
              className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed relative inline-block"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <span className="gradient-text">hay chispa.</span>
              <motion.span
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="absolute -right-8 -top-2 w-5 h-5 text-primary" />
              </motion.span>
            </motion.p>
          </motion.div>

          {/* Feature highlights with stagger */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 pt-4" 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 1.2 }
              }
            }}
          >
            {["Sin algoritmos", "Sin presión", "Sin ruido"].map((tag, index) => (
              <motion.div 
                key={index} 
                className="px-4 py-2 rounded-full glass border border-primary/20 animate-border-glow"
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.8 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { type: "spring", stiffness: 200 }
                  }
                }}
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary) / 0.5)" }}
              >
                <span className="font-body text-sm text-foreground/80">{tag}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Subtle description */}
          <motion.p 
            className="font-body text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            Un espacio para quienes buscan conexiones reales, no likes.
          </motion.p>

          {/* CTA with enhanced glow effect */}
          <motion.div 
            className="pt-8" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="kiki" 
                size="xl" 
                onClick={() => navigate("/auth")} 
                className="w-full max-w-xs relative group overflow-hidden shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 fill-current" />
                  Entrar
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
                  style={{ backgroundSize: "200% 100%" }}
                  animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </Button>
            </motion.div>
          </motion.div>

          {/* Scroll indicator with enhanced animation */}
          <motion.div 
            className="pt-12" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.2 }}
          >
            <motion.div 
              className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full mx-auto flex justify-center relative overflow-hidden"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div 
                className="w-1.5 h-3 bg-primary rounded-full mt-2"
                animate={{ 
                  y: [0, 12, 0],
                  opacity: [1, 0, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex items-center py-24 px-6 relative noise-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        
        <div className="max-w-6xl mx-auto w-full relative z-10">
          <motion.div 
            className="text-center mb-16" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={fadeInUp}
          >
            <motion.h2 
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4"
              whileInView={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Diferente por diseño
            </motion.h2>
            <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
              No es otra app de citas. Es un espacio donde las conexiones nacen de forma natural.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                variants={scaleIn} 
                className="group p-8 rounded-3xl glass-dark border border-border/20 hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 60px -20px hsl(var(--primary) / 0.3)",
                }}
              >
                {/* Hover gradient overlay */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.1) 0%, transparent 60%)",
                  }}
                />
                
                <div className="mb-6 relative">
                  <motion.div 
                    className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1.5 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="relative w-10 h-10 text-primary" />
                  </motion.div>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="min-h-screen flex items-center py-24 px-6 relative overflow-hidden">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <motion.div 
            className="text-center mb-20" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={fadeInUp}
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Así funciona
            </h2>
            <p className="font-body text-lg text-muted-foreground">
              Simple. Sin complicaciones. Sin drama.
            </p>
          </motion.div>

          <motion.div 
            className="space-y-12" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            variants={staggerContainer}
          >
            {howItWorks.map((item, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp} 
                className="flex gap-8 items-start group"
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex-shrink-0 relative">
                  <motion.span 
                    className="font-display text-6xl md:text-7xl font-bold text-primary/20 group-hover:text-primary/50 transition-colors duration-500"
                    whileHover={{ scale: 1.1 }}
                  >
                    {item.step}
                  </motion.span>
                  <motion.div
                    className="absolute -right-2 -top-2"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.2 }}
                  >
                    <item.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
                <div className="pt-4">
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="font-body text-lg text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="min-h-screen flex items-center py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
        {/* Animated background quotes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute font-display text-[200px] font-bold text-primary whitespace-nowrap"
              style={{ top: `${20 + i * 30}%` }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 30 + i * 10, 
                repeat: Infinity, 
                ease: "linear",
                delay: i * 5,
              }}
            >
              KIKI • CHISPA • CONEXIÓN •
            </motion.div>
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <motion.div 
            className="space-y-16" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={staggerContainer}
          >
            {quotes.map((quote, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp} 
                className="text-center relative"
                whileInView={{
                  opacity: [0, 1],
                  y: [50, 0],
                }}
                transition={{ delay: index * 0.2 }}
              >
                <motion.div
                  className="absolute -left-8 top-0 text-primary/20"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.2 }}
                >
                  <Star className="w-8 h-8 fill-current" />
                </motion.div>
                <p className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground/90 leading-tight">
                  "{quote}"
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section with Auto Carousel */}
      <TestimonialsCarousel testimonials={testimonials} />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <section className="min-h-[70vh] flex items-center justify-center py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.1) 50%, transparent 70%)",
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <motion.div 
          className="relative z-10 text-center space-y-8 max-w-xl" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={staggerContainer}
        >
          <motion.div 
            variants={scaleIn}
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Heart className="w-20 h-20 text-primary fill-primary mx-auto animate-heartbeat drop-shadow-[0_0_40px_hsl(var(--primary)/0.6)]" />
          </motion.div>
          
          <motion.h2 
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground glow-text" 
            variants={fadeInUp}
          >
            ¿Tienes chispa?
          </motion.h2>
          
          <motion.p 
            className="font-body text-lg text-muted-foreground" 
            variants={fadeInUp}
          >
            Solo para quienes entienden.
          </motion.p>
          
          <motion.div variants={fadeInUp}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="kiki" 
                size="xl" 
                onClick={() => navigate("/auth")} 
                className="relative group overflow-hidden shadow-[0_0_50px_hsl(var(--primary)/0.4)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Unirme a KIKI
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
                  style={{ backgroundSize: "200% 100%" }}
                  animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Bottom decorative line with animation */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(to right, transparent, hsl(var(--primary) / 0.5), transparent)",
          }}
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
