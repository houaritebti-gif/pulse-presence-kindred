import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Flame,
  Ghost,
  Users,
  Sparkles,
  Heart,
  Eye,
  MessageCircle,
  Zap,
  Trophy,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Tip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  category: "basics" | "sparks" | "social" | "advanced";
}

const tips: Tip[] = [
  {
    id: "presence",
    icon: <Eye className="w-4 h-4" />,
    title: "Activa tu Presencia",
    description: "Entra en la sección Presencia para hacerte visible. Solo los usuarios activos pueden verse entre sí.",
    category: "basics",
  },
  {
    id: "spark",
    icon: <Flame className="w-4 h-4" />,
    title: "Envía Chispas",
    description: "Desliza a la derecha en un perfil para enviar una Chispa. Si ambos os enviáis Chispas, ¡se crea una conexión!",
    category: "sparks",
  },
  {
    id: "ghost",
    icon: <Ghost className="w-4 h-4" />,
    title: "Mensajes Fantasma",
    description: "Envía un mensaje anónimo deslizando hacia arriba. El destinatario no sabrá quién eres hasta que responda.",
    category: "sparks",
  },
  {
    id: "mutual",
    icon: <Heart className="w-4 h-4" />,
    title: "Conexiones mutuas",
    description: "Cuando hay interés mutuo (Chispa + Chispa o respuesta a Mensaje Fantasma), se abre un chat privado.",
    category: "social",
  },
  {
    id: "quedadas",
    icon: <Calendar className="w-4 h-4" />,
    title: "Crea Quedadas",
    description: "Organiza eventos y conoce gente en grupo. Los asistentes pueden chatear antes del evento.",
    category: "social",
  },
  {
    id: "profile",
    icon: <Users className="w-4 h-4" />,
    title: "Completa tu perfil",
    description: "Un perfil completo aumenta tus posibilidades. Añade fotos, bio, intereses y tu vibe.",
    category: "basics",
  },
  {
    id: "energy",
    icon: <Zap className="w-4 h-4" />,
    title: "Gana Energía Spark",
    description: "Realiza acciones diarias para ganar energía. Úsala para comprar potenciadores en la tienda.",
    category: "advanced",
  },
  {
    id: "achievements",
    icon: <Trophy className="w-4 h-4" />,
    title: "Desbloquea logros",
    description: "Completa retos para ganar insignias y subir en el ranking. ¡Demuestra tu nivel de socialización!",
    category: "advanced",
  },
  {
    id: "super-spark",
    icon: <Sparkles className="w-4 h-4" />,
    title: "Super Spark",
    description: "Destaca entre la multitud enviando un Super Spark. El destinatario verá que realmente te interesa.",
    category: "sparks",
  },
  {
    id: "chat",
    icon: <MessageCircle className="w-4 h-4" />,
    title: "Chats privados",
    description: "Una vez conectados, podéis chatear sin límites. ¡Respeta siempre y sé auténtico!",
    category: "social",
  },
];

const categoryLabels = {
  basics: { label: "Básicos", color: "text-blue-500" },
  sparks: { label: "Chispas", color: "text-orange-500" },
  social: { label: "Social", color: "text-green-500" },
  advanced: { label: "Avanzado", color: "text-purple-500" },
};

export const QuickTipsCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTips = selectedCategory
    ? tips.filter((tip) => tip.category === selectedCategory)
    : tips;

  return (
    <Card className="overflow-hidden border-foreground/5 shadow-md shadow-foreground/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Consejos rápidos</h3>
            <p className="text-xs text-muted-foreground">
              {tips.length} consejos para sacar el máximo partido
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="pt-0 pb-4 px-4">
              {/* Category filters */}
              <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-border">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    selectedCategory === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Todos
                </button>
                {Object.entries(categoryLabels).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      selectedCategory === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tips list */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {filteredTips.map((tip, index) => (
                    <motion.div
                      key={tip.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          tip.category === "basics" && "bg-blue-500/20 text-blue-500",
                          tip.category === "sparks" && "bg-orange-500/20 text-orange-500",
                          tip.category === "social" && "bg-green-500/20 text-green-500",
                          tip.category === "advanced" && "bg-purple-500/20 text-purple-500"
                        )}
                      >
                        {tip.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-medium text-sm text-foreground">
                            {tip.title}
                          </h4>
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              categoryLabels[tip.category].color
                            )}
                          >
                            {categoryLabels[tip.category].label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tip.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default QuickTipsCard;
