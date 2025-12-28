import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => {
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
          Política de Privacidad
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Información que Recopilamos</h2>
            <p>
              En KIKI recopilamos la siguiente información para proporcionar nuestros servicios:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Información de registro:</strong> nombre, correo electrónico y ciudad.</li>
              <li><strong>Información de perfil:</strong> fotos, preferencias musicales, tribus y descripción personal.</li>
              <li><strong>Datos de uso:</strong> interacciones con otros usuarios, mensajes y presencia en la aplicación.</li>
              <li><strong>Información técnica:</strong> tipo de dispositivo, navegador y dirección IP.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Cómo Utilizamos tu Información</h2>
            <p>Utilizamos tu información para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar y mejorar nuestros servicios de conexión social.</li>
              <li>Facilitar la comunicación entre usuarios.</li>
              <li>Enviar notificaciones relevantes sobre la actividad de tu cuenta.</li>
              <li>Garantizar la seguridad y prevenir el fraude.</li>
              <li>Cumplir con obligaciones legales.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Compartir Información</h2>
            <p>
              No vendemos tu información personal. Podemos compartir datos con:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Otros usuarios según tus configuraciones de privacidad.</li>
              <li>Proveedores de servicios que nos ayudan a operar la plataforma.</li>
              <li>Autoridades legales cuando sea requerido por ley.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a tus datos personales.</li>
              <li>Rectificar información incorrecta.</li>
              <li>Solicitar la eliminación de tu cuenta y datos.</li>
              <li>Oponerte al procesamiento de tus datos.</li>
              <li>Portabilidad de tus datos.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Seguridad</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, 
              incluyendo encriptación de datos y acceso restringido a información personal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Retención de Datos</h2>
            <p>
              Conservamos tu información mientras mantengas una cuenta activa. Puedes solicitar 
              la eliminación de tus datos en cualquier momento contactándonos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad, puedes contactarnos en:{" "}
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

export default Privacy;
