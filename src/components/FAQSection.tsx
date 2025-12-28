import { motion } from "framer-motion";
import { HelpCircle, Plus, Minus } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const faqs = [
  {
    question: "¿Qué hace diferente a KIKI de otras apps de citas?",
    answer: "KIKI se centra en conexiones auténticas, no en swipes vacíos. Aquí no hay algoritmos decidiendo por ti, ni presión por tener la foto perfecta. Puedes controlar tu visibilidad y solo aparecer cuando realmente quieras conocer gente."
  },
  {
    question: "¿Cómo funciona el sistema de chispas?",
    answer: "Cuando alguien te interesa, le envías una chispa. Si esa persona también siente curiosidad por ti y te devuelve la chispa, se abre la conversación. Es mutuo, sin presiones ni mensajes no deseados."
  },
  {
    question: "¿Tengo que subir fotos obligatoriamente?",
    answer: "No. En KIKI creemos que las conexiones van más allá de lo visual. Puedes elegir si quieres compartir fotos o no. Lo importante es la conversación y la vibra que transmites."
  },
  {
    question: "¿Qué es la función de presencia?",
    answer: "La presencia te permite indicar cuándo estás disponible para conectar. Puedes encenderla cuando tengas ganas de conocer gente y apagarla cuando prefieras descansar. Tú controlas tu tiempo."
  },
  {
    question: "¿Es gratis usar KIKI?",
    answer: "KIKI ofrece un plan gratuito con todas las funciones básicas. También tenemos planes premium que desbloquean características adicionales como mensajes fantasma, quedadas exclusivas y más."
  },
  {
    question: "¿Cómo protegen mi privacidad?",
    answer: "Tu privacidad es nuestra prioridad. No vendemos datos, no compartimos información con terceros y tú decides quién puede ver tu perfil. Además, puedes bloquear y reportar usuarios de forma anónima."
  },
  {
    question: "¿Qué son las quedadas?",
    answer: "Las quedadas son eventos creados por la comunidad para conocerse en persona. Pueden ser desde un café tranquilo hasta un concierto. Es una forma segura de dar el salto del chat a la vida real."
  },
  {
    question: "¿Puedo usar KIKI si no vivo en una gran ciudad?",
    answer: "¡Por supuesto! KIKI funciona en toda España. Aunque hay más usuarios en grandes ciudades, nuestra comunidad está creciendo en todas partes. La autenticidad no tiene código postal."
  },
];

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background" />
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-1/4 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div className="max-w-3xl mx-auto w-full relative z-10">
        {/* Header */}
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
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="font-body text-sm text-foreground/80">Resolvemos tus dudas</span>
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Preguntas <span className="gradient-text">frecuentes</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            Todo lo que necesitas saber sobre KIKI antes de dar el paso.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          <Accordion 
            type="multiple" 
            value={openItems}
            onValueChange={setOpenItems}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                custom={index}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="border-none"
                >
                  <motion.div
                    className="rounded-2xl glass-dark border border-border/20 overflow-hidden transition-all duration-300 hover:border-primary/30"
                    whileHover={{ scale: 1.01 }}
                    animate={{
                      borderColor: openItems.includes(`item-${index}`) 
                        ? "hsl(var(--primary) / 0.4)" 
                        : "hsl(var(--border) / 0.2)"
                    }}
                  >
                    <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                      <div className="flex items-center gap-4 text-left w-full">
                        <motion.div
                          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                          animate={{
                            backgroundColor: openItems.includes(`item-${index}`) 
                              ? "hsl(var(--primary) / 0.2)" 
                              : "hsl(var(--primary) / 0.1)"
                          }}
                        >
                          <motion.div
                            animate={{ rotate: openItems.includes(`item-${index}`) ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {openItems.includes(`item-${index}`) ? (
                              <Minus className="w-5 h-5 text-primary" />
                            ) : (
                              <Plus className="w-5 h-5 text-primary" />
                            )}
                          </motion.div>
                        </motion.div>
                        <span className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-5">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pl-14"
                      >
                        <p className="font-body text-foreground/70 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    </AccordionContent>
                  </motion.div>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-body text-muted-foreground">
            ¿Tienes más preguntas?{" "}
            <a 
              href="mailto:hola@kiki.app" 
              className="text-primary hover:underline font-medium transition-colors"
            >
              Escríbenos
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
