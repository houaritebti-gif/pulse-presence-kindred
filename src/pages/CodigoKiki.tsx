import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Shield, Camera, MessageSquare, Users, Sparkles, Ban, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CodeRule {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const codeRules: CodeRule[] = [
  {
    icon: <Heart className="w-6 h-6 text-primary" />,
    title: "Respeta siempre",
    description: "Trata a cada persona como te gustaría que te trataran. El respeto es la base de toda conexión genuina."
  },
  {
    icon: <Ban className="w-6 h-6 text-destructive" />,
    title: "Cero acoso",
    description: "No insistas si alguien no responde. El silencio también es una respuesta válida y debe respetarse."
  },
  {
    icon: <Camera className="w-6 h-6 text-amber-500" />,
    title: "No hagas capturas",
    description: "Las conversaciones y perfiles son privados. Hacer capturas de pantalla viola la confianza de la comunidad."
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
    title: "Cuida tu lenguaje",
    description: "Evita insultos, lenguaje ofensivo o comentarios despectivos. La comunicación respetuosa es esencial."
  },
  {
    icon: <Shield className="w-6 h-6 text-emerald-500" />,
    title: "Protege tu privacidad",
    description: "No compartas datos personales sensibles. Tu seguridad es lo primero."
  },
  {
    icon: <Users className="w-6 h-6 text-violet-500" />,
    title: "Sé auténtico/a",
    description: "Usa fotos reales y recientes. La honestidad construye conexiones verdaderas."
  },
  {
    icon: <Camera className="w-6 h-6 text-rose-500" />,
    title: "Foto de perfil obligatoria y nítida",
    description: "Tu foto de perfil debe ser real, clara y nítida. No se permiten fotos borrosas, de paisajes o sin rostro visible."
  },
  {
    icon: <HandHeart className="w-6 h-6 text-pink-500" />,
    title: "Acepta la diversidad",
    description: "KIKI es un espacio inclusivo para todas las identidades, orientaciones y formas de ser."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
    title: "Disfruta el proceso",
    description: "Las mejores conexiones nacen sin presión. Disfruta conociendo gente sin expectativas."
  }
];

const CodigoKiki = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Código KIKI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Nuestra comunidad se basa en el respeto mutuo. Estas son las normas que nos hacen especiales.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {codeRules.map((rule, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-background/80">
                    {rule.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">
                      {rule.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
          <p className="text-foreground font-medium mb-2">
            ¿Has visto algo que no cumple el código?
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            Reporta cualquier comportamiento inapropiado. Revisamos cada caso con atención.
          </p>
          <p className="text-sm text-muted-foreground">
            Contacta:{" "}
            <a href="mailto:seguridad@kiki.app" className="text-primary hover:underline">
              seguridad@kiki.app
            </a>
          </p>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            El incumplimiento del Código KIKI puede resultar en la suspensión o eliminación de tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodigoKiki;
