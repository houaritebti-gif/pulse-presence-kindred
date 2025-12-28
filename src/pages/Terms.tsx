import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <h1 className="font-display text-4xl font-bold text-foreground mb-8">
          Términos de Servicio
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar KIKI, aceptas estos términos de servicio en su totalidad. 
              Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Elegibilidad</h2>
            <p>Para usar KIKI debes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tener al menos 18 años de edad.</li>
              <li>No estar prohibido de usar el servicio bajo las leyes aplicables.</li>
              <li>No haber sido previamente suspendido o eliminado de la plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Tu Cuenta</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. 
              Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Conducta del Usuario</h2>
            <p>Al usar KIKI, te comprometes a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información veraz y actualizada.</li>
              <li>Respetar a otros usuarios y no acosar, amenazar o discriminar.</li>
              <li>No publicar contenido ilegal, ofensivo o que infrinja derechos de terceros.</li>
              <li>No utilizar la plataforma para actividades comerciales no autorizadas.</li>
              <li>No intentar hackear, comprometer o dañar el servicio.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Contenido del Usuario</h2>
            <p>
              Mantienes la propiedad de tu contenido, pero nos otorgas una licencia para usar, 
              mostrar y distribuir dicho contenido dentro de la plataforma. Eres responsable 
              de todo el contenido que publiques.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Suscripciones y Pagos</h2>
            <p>
              Algunas funciones de KIKI requieren una suscripción de pago. Los pagos son 
              procesados de forma segura y las suscripciones se renuevan automáticamente 
              hasta que las canceles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Terminación</h2>
            <p>
              Podemos suspender o terminar tu cuenta si violas estos términos. Puedes 
              eliminar tu cuenta en cualquier momento desde la configuración de tu perfil.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Limitación de Responsabilidad</h2>
            <p>
              KIKI se proporciona "tal cual". No garantizamos resultados específicos del uso 
              de la plataforma. No somos responsables de las interacciones entre usuarios 
              fuera de la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Cambios en los Términos</h2>
            <p>
              Podemos modificar estos términos en cualquier momento. Te notificaremos sobre 
              cambios significativos. El uso continuado de la plataforma constituye la 
              aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Contacto</h2>
            <p>
              Para consultas sobre estos términos, contacta:{" "}
              <a href="mailto:legal@kiki.app" className="text-primary hover:underline">
                legal@kiki.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
