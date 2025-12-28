import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Testimonial {
  name: string;
  age: number;
  city: string;
  text: string;
  avatar: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const TestimonialsCarousel = ({ testimonials }: TestimonialsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    }),
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <motion.div 
          className="text-center mb-16" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={fadeInUp}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-body text-sm text-foreground/80">Historias reales</span>
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Lo que dicen de <span className="gradient-text">KIKI</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            Personas reales, conexiones reales. Sin filtros, sin guiones.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div 
          className="relative max-w-2xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass border border-border/20 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary/40 transition-all duration-300 hover:scale-110"
            aria-label="Anterior testimonio"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass border border-border/20 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary/40 transition-all duration-300 hover:scale-110"
            aria-label="Siguiente testimonio"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel Content */}
          <div className="relative h-[320px] md:h-[280px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
              >
                <div className="relative p-8 rounded-3xl glass-dark border border-border/20 h-full">
                  {/* Quote icon */}
                  <motion.div 
                    className="absolute top-6 right-6 text-primary/10"
                    initial={{ opacity: 0, scale: 0, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Quote className="w-12 h-12" />
                  </motion.div>
                  
                  {/* Gradient overlay */}
                  <div 
                    className="absolute inset-0 rounded-3xl"
                    style={{
                      background: "radial-gradient(circle at 50% 100%, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Avatar and info */}
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div 
                        className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl border-2 border-primary/30"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      >
                        {currentTestimonial.avatar}
                      </motion.div>
                      <div>
                        <motion.h4 
                          className="font-display text-lg font-bold text-foreground"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {currentTestimonial.name}
                        </motion.h4>
                        <motion.p 
                          className="font-body text-sm text-muted-foreground"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          {currentTestimonial.age} años • {currentTestimonial.city}
                        </motion.p>
                      </div>
                    </div>
                    
                    {/* Testimonial text */}
                    <motion.p 
                      className="font-body text-foreground/80 leading-relaxed text-lg flex-grow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      "{currentTestimonial.text}"
                    </motion.p>
                    
                    {/* Stars rating */}
                    <motion.div 
                      className="flex gap-1 mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 300 }}
                        >
                          <Star className="w-4 h-4 text-primary fill-primary" />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="group relative p-1"
                aria-label={`Ir al testimonio ${index + 1}`}
              >
                <motion.div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "bg-primary" 
                      : "bg-foreground/20 hover:bg-foreground/40"
                  }`}
                  animate={index === currentIndex ? {
                    scale: [1, 1.3, 1],
                  } : {}}
                  transition={{ duration: 0.5 }}
                />
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 max-w-xs mx-auto h-1 bg-foreground/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ 
                duration: 5, 
                ease: "linear",
                repeat: Infinity,
              }}
              key={currentIndex}
            />
          </div>
        </div>
        
        {/* Bottom stats */}
        <motion.div 
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {[
            { value: "10K+", label: "Usuarios activos" },
            { value: "50K+", label: "Chispas enviadas" },
            { value: "98%", label: "Conexiones reales" },
          ].map((stat, index) => (
            <motion.div 
              key={index}
              variants={fadeInUp}
              className="text-center"
            >
              <motion.div 
                className="font-display text-3xl md:text-4xl font-bold gradient-text"
                whileInView={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              >
                {stat.value}
              </motion.div>
              <p className="font-body text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
