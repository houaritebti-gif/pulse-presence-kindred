import { Instagram, Twitter, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { KikiLogo } from "@/components/KikiLogo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border/20">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-3">
              <KikiLogo size="lg" />
            </div>
            <p className="text-foreground/80 text-sm max-w-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
              Conecta con personas afines en tu ciudad. Presencia en tiempo real, 
              chispas mutuas y quedadas grupales.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacidad" 
                  className="text-foreground/80 hover:text-primary transition-colors text-sm"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link 
                  to="/terminos" 
                  className="text-foreground/80 hover:text-primary transition-colors text-sm"
                >
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="text-foreground/80 hover:text-primary transition-colors text-sm"
                >
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Síguenos</h4>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com/kiki" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/kiki" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://discord.gg/kiki" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Discord"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/85 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
            © {currentYear} KIKI. Todos los derechos reservados.
          </p>
          <p className="text-foreground/85 text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
            Hecho con 💜 para la comunidad alternativa
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
