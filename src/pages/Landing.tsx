import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, MessageCircle, Users, Zap, Eye, Shield } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
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

  const features = [
    {
      icon: Eye,
      title: "Sin algoritmos",
      description: "Nadie decide por ti quién deberías conocer. Tú eliges."
    },
    {
      icon: Heart,
      title: "Chispas reales",
      description: "Conexiones que nacen de la curiosidad, no de un swipe."
    },
    {
      icon: Shield,
      title: "Tu espacio",
      description: "Controla tu visibilidad. Aparece cuando quieras."
    },
    {
      icon: MessageCircle,
      title: "Conversaciones",
      description: "Habla primero, juzga después. Sin fotos obligatorias."
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Enciende tu presencia",
      description: "Cuando estés disponible, activa tu llama. Los demás sabrán que estás ahí."
    },
    {
      step: "02",
      title: "Explora perfiles",
      description: "Descubre personas por su vibe, no por su foto. Lee entre líneas."
    },
    {
      step: "03",
      title: "Lanza una chispa",
      description: "Si algo te llama la atención, envía una chispa. Si es mutua, nace la conversación."
    }
  ];

  const quotes = [
    "Las mejores conexiones no se fuerzan.",
    "Aquí no hay matches, hay momentos.",
    "Menos ruido, más chispa."
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ y: backgroundY }}
        >
          {/* Main gradient orb */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse-soft" />
          
          {/* Floating accent orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute top-2/3 left-1/3 w-24 h-24 bg-primary/15 rounded-full blur-xl animate-float" style={{ animationDelay: "4s" }} />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </motion.div>
        
        <motion.div 
          className="relative z-10 max-w-2xl w-full text-center space-y-8"
          style={{ opacity }}
        >
          {/* Flame icon with glow */}
          <motion.div 
            className="flex justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150 animate-pulse-soft" />
              <Heart className="relative w-16 h-16 md:w-20 md:h-20 text-primary fill-primary animate-pulse-soft" />
            </div>
          </motion.div>

          {/* Logo with dramatic typography */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <h1 className="font-display text-8xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter text-foreground leading-none">
              KIKI
            </h1>
          </motion.div>

          {/* Tagline with emphasis */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <p className="font-display text-xl md:text-2xl lg:text-3xl font-medium text-foreground/80 leading-relaxed">
              aquí no hay match,
            </p>
            <p className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed relative inline-block">
              <span className="gradient-text">hay chispa.</span>
              <Sparkles className="absolute -right-8 -top-2 w-5 h-5 text-primary animate-pulse-soft" />
            </p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            {["Sin algoritmos", "Sin presión", "Sin ruido"].map((tag, index) => (
              <div key={index} className="px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/20">
                <span className="font-body text-sm text-card-foreground/80">{tag}</span>
              </div>
            ))}
          </motion.div>

          {/* Subtle description */}
          <motion.p 
            className="font-body text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Un espacio para quienes buscan conexiones reales, no likes.
          </motion.p>

          {/* CTA with glow effect */}
          <motion.div 
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Button 
              variant="kiki" 
              size="xl"
              onClick={() => navigate("/auth")}
              className="w-full max-w-xs relative group overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 fill-current" />
                Entrar
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundPosition: "0% 0%", animation: "shimmer 3s ease-in-out infinite" }} />
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            className="pt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <motion.div 
              className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full mx-auto flex justify-center"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-1.5 h-3 bg-primary/50 rounded-full mt-2" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex items-center py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        
        <div className="max-w-6xl mx-auto w-full relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Diferente por diseño
            </h2>
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
                className="group p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border/20 hover:border-primary/30 transition-all duration-500 hover:bg-card/80"
              >
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                  <feature.icon className="relative w-10 h-10 text-primary" />
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        
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
              >
                <div className="flex-shrink-0">
                  <span className="font-display text-6xl md:text-7xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors duration-500">
                    {item.step}
                  </span>
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
      <section className="min-h-screen flex items-center py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
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
                className="text-center"
              >
                <p className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground/90 leading-tight">
                  "{quote}"
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-[70vh] flex items-center justify-center py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary/30 via-primary/10 to-transparent rounded-full blur-3xl" />
        </div>
        
        <motion.div 
          className="relative z-10 text-center space-y-8 max-w-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={scaleIn}>
            <Heart className="w-20 h-20 text-primary fill-primary mx-auto animate-pulse-soft" />
          </motion.div>
          
          <motion.h2 
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground"
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
            <Button 
              variant="kiki" 
              size="xl"
              onClick={() => navigate("/auth")}
              className="relative group overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Unirme a KIKI
              </span>
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </section>
    </div>
  );
};

export default Landing;
