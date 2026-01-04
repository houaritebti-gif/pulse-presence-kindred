import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Plus, Minus, Sparkles, Shield, CreditCard } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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

type FAQCategory = "all" | "general" | "security" | "payments";

interface FAQ {
  question: string;
  answer: string;
  category: "general" | "security" | "payments";
}

const faqs: FAQ[] = [
  // General
  {
    question: "¿Qué hace diferente a KIKI de otras apps de citas?",
    answer: "KIKI se centra en conexiones auténticas, no en swipes vacíos. Aquí no hay algoritmos decidiendo por ti, ni presión por tener la foto perfecta. Puedes controlar tu visibilidad y solo aparecer cuando realmente quieras conocer gente.",
    category: "general"
  },
  {
    question: "¿Cómo funciona el sistema de chispas?",
    answer: "Cuando alguien te interesa, le envías una chispa. Si esa persona también siente curiosidad por ti y te devuelve la chispa, se abre la conversación. Es mutuo, sin presiones ni mensajes no deseados.",
    category: "general"
  },
  {
    question: "¿Tengo que subir fotos obligatoriamente?",
    answer: "No. En KIKI creemos que las conexiones van más allá de lo visual. Puedes elegir si quieres compartir fotos o no. Lo importante es la conversación y la vibra que transmites.",
    category: "general"
  },
  {
    question: "¿Qué es la función de presencia?",
    answer: "La presencia te permite indicar cuándo estás disponible para conectar. Puedes encenderla cuando tengas ganas de conocer gente y apagarla cuando prefieras descansar. Tú controlas tu tiempo.",
    category: "general"
  },
  {
    question: "¿Es gratis usar KIKI?",
    answer: "KIKI ofrece un plan gratuito con todas las funciones básicas. También tenemos planes premium que desbloquean características adicionales como mensajes fantasma, quedadas exclusivas y más.",
    category: "general"
  },
  {
    question: "¿Cómo protegen mi privacidad?",
    answer: "Tu privacidad es nuestra prioridad. No vendemos datos, no compartimos información con terceros y tú decides quién puede ver tu perfil. Además, puedes bloquear y reportar usuarios de forma anónima.",
    category: "general"
  },
  {
    question: "¿Qué son las quedadas?",
    answer: "Las quedadas son eventos creados por la comunidad para conocerse en persona. Pueden ser desde un café tranquilo hasta un concierto. Es una forma segura de dar el salto del chat a la vida real.",
    category: "general"
  },
  {
    question: "¿Puedo usar KIKI si no vivo en una gran ciudad?",
    answer: "¡Por supuesto! KIKI funciona en toda España. Aunque hay más usuarios en grandes ciudades, nuestra comunidad está creciendo en todas partes. La autenticidad no tiene código postal.",
    category: "general"
  },
  // Security
  {
    question: "¿Cómo verifican que los perfiles son reales?",
    answer: "Utilizamos verificación por email y ofrecemos verificación opcional por foto. Además, nuestro sistema detecta comportamientos sospechosos y nuestra comunidad puede reportar perfiles falsos, que revisamos manualmente.",
    category: "security"
  },
  {
    question: "¿Qué pasa si alguien me acosa o me hace sentir incómodo/a?",
    answer: "Puedes bloquear a cualquier usuario instantáneamente. También puedes reportar comportamientos inapropiados de forma anónima. Nuestro equipo revisa cada reporte en menos de 24 horas y toma medidas según la gravedad.",
    category: "security"
  },
  {
    question: "¿Pueden ver mi ubicación exacta otros usuarios?",
    answer: "Nunca. Solo mostramos la ciudad que tú elijas indicar en tu perfil. No compartimos coordenadas GPS ni ubicación en tiempo real. Tu seguridad física es fundamental.",
    category: "security"
  },
  {
    question: "¿Mis conversaciones están cifradas?",
    answer: "Sí, todas las conversaciones en KIKI están cifradas en tránsito y en reposo. Nadie, ni siquiera nosotros, puede leer tus mensajes privados. Tu intimidad está protegida.",
    category: "security"
  },
  {
    question: "¿Qué datos míos almacenan y por cuánto tiempo?",
    answer: "Solo almacenamos los datos necesarios para el funcionamiento de la app. Puedes solicitar una copia de tus datos o su eliminación completa en cualquier momento desde la configuración de tu cuenta, cumpliendo con el RGPD.",
    category: "security"
  },
  // Payments
  {
    question: "¿Qué incluyen los planes de pago?",
    answer: "El plan Plus incluye acceso al chatbot IA y sugerencias personalizadas. El plan Premium añade la posibilidad de crear quedadas, badge exclusivo y acceso anticipado a novedades. Puedes ver todos los detalles en nuestra página de suscripción.",
    category: "payments"
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express), así como Apple Pay y Google Pay. Todos los pagos se procesan de forma segura a través de Stripe.",
    category: "payments"
  },
  {
    question: "¿Puedo cancelar mi suscripción en cualquier momento?",
    answer: "Absolutamente. No hay permanencia ni compromisos. Puedes cancelar tu suscripción desde la app cuando quieras y seguirás teniendo acceso premium hasta el final del período pagado.",
    category: "payments"
  },
  {
    question: "¿Hay período de prueba gratuito?",
    answer: "Sí, ofrecemos 7 días de prueba gratuita para el plan Premium. Puedes cancelar antes de que termine sin que te cobremos nada. Es nuestra forma de dejarte probar antes de decidir.",
    category: "payments"
  },
  {
    question: "¿Qué pasa si no estoy satisfecho/a con mi compra?",
    answer: "Si no estás contento/a con tu suscripción, contacta con nosotros en los primeros 14 días y te haremos un reembolso completo, sin preguntas. Tu satisfacción es nuestra prioridad.",
    category: "payments"
  },
  {
    question: "¿Mis datos de pago están seguros?",
    answer: "Totalmente. No almacenamos datos de tarjetas en nuestros servidores. Todo el procesamiento de pagos lo gestiona Stripe, líder mundial en seguridad de pagos con certificación PCI DSS nivel 1.",
    category: "payments"
  },
];

const categories = [
  { id: "all" as FAQCategory, label: "Todas", icon: HelpCircle },
  { id: "general" as FAQCategory, label: "General", icon: Sparkles },
  { id: "security" as FAQCategory, label: "Seguridad", icon: Shield },
  { id: "payments" as FAQCategory, label: "Pagos", icon: CreditCard },
];

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("all");

  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const handleCategoryChange = (category: FAQCategory) => {
    setActiveCategory(category);
    setOpenItems([]); // Reset open items when changing category
  };

  return (
    <section className="py-20 px-6 relative overflow-hidden bg-background">
      <div className="max-w-2xl mx-auto w-full relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-10" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={fadeInUp}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="font-body text-sm text-foreground">Resolvemos tus dudas</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Preguntas frecuentes
          </h2>
          <p className="font-body text-base text-muted-foreground max-w-md mx-auto">
            Todo lo que necesitas saber sobre KIKI antes de dar el paso.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const count = category.id === "all" 
              ? faqs.length 
              : faqs.filter(f => f.category === category.id).length;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm font-medium transition-all border",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* FAQ Accordion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Accordion 
              type="multiple" 
              value={openItems}
              onValueChange={setOpenItems}
              className="space-y-2"
            >
              {filteredFaqs.map((faq, index) => (
                <AccordionItem 
                  key={`${activeCategory}-${index}`}
                  value={`item-${index}`}
                  className="border-none"
                >
                  <div className={cn(
                    "rounded-xl bg-card border transition-colors",
                    openItems.includes(`item-${index}`) 
                      ? "border-primary/30" 
                      : "border-border"
                  )}>
                    <AccordionTrigger className="px-4 py-4 hover:no-underline group [&[data-state=open]>div>div:first-child]:bg-primary/20">
                      <div className="flex items-center gap-3 text-left w-full">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                          {openItems.includes(`item-${index}`) ? (
                            <Minus className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span className="font-display text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="pl-11">
                        <p className="font-body text-sm text-card-foreground/70 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </AccordionContent>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </AnimatePresence>

        {/* Empty state */}
        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay preguntas en esta categoría.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="font-body text-muted-foreground">
            ¿Tienes más preguntas?{" "}
            <a 
              href="mailto:hola@kiki.app" 
              className="text-primary hover:underline font-medium transition-colors"
            >
              Escríbenos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
