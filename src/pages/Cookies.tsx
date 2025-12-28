import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Cookies = () => {
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
          Política de Cookies
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando 
              visitas un sitio web. Nos ayudan a recordar tus preferencias y mejorar tu experiencia.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Tipos de Cookies que Utilizamos</h2>
            
            <h3 className="text-xl font-medium text-foreground">Cookies Esenciales</h3>
            <p>
              Son necesarias para el funcionamiento básico de la plataforma. Incluyen cookies de 
              autenticación y seguridad. No pueden ser desactivadas.
            </p>

            <h3 className="text-xl font-medium text-foreground">Cookies de Funcionalidad</h3>
            <p>
              Nos permiten recordar tus preferencias como idioma, tema (claro/oscuro) y 
              configuraciones de notificaciones.
            </p>

            <h3 className="text-xl font-medium text-foreground">Cookies de Análisis</h3>
            <p>
              Nos ayudan a entender cómo los usuarios interactúan con KIKI para mejorar 
              nuestros servicios. Recopilan información de forma anónima.
            </p>

            <h3 className="text-xl font-medium text-foreground">Cookies de Rendimiento</h3>
            <p>
              Optimizan el rendimiento de la aplicación y ayudan a identificar problemas técnicos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Cookies de Terceros</h2>
            <p>
              Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Proveedores de autenticación:</strong> para inicios de sesión seguros.</li>
              <li><strong>Procesadores de pago:</strong> para transacciones seguras.</li>
              <li><strong>Servicios de análisis:</strong> para estadísticas de uso.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Gestión de Cookies</h2>
            <p>
              Puedes controlar y eliminar cookies a través de la configuración de tu navegador. 
              Ten en cuenta que desactivar ciertas cookies puede afectar la funcionalidad de KIKI.
            </p>
            <p>Cómo gestionar cookies en los navegadores más populares:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Almacenamiento Local</h2>
            <p>
              Además de cookies, utilizamos almacenamiento local del navegador (localStorage) 
              para guardar preferencias de usuario y datos de la aplicación que mejoran 
              tu experiencia offline.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Actualizaciones</h2>
            <p>
              Esta política puede actualizarse periódicamente. Te notificaremos sobre 
              cambios significativos a través de la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, contacta:{" "}
              <a href="mailto:privacidad@kiki.app" className="text-primary hover:underline">
                privacidad@kiki.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
