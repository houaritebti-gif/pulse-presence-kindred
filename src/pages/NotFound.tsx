import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, Users, Flame, ArrowLeft } from "lucide-react";
import { KikiLogo } from "@/components/KikiLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const quickLinks = [
    { to: "/", icon: Home, label: "Inicio", description: "Volver a la página principal" },
    { to: "/presence", icon: Users, label: "Presencia", description: "Descubre quién está activo" },
    { to: "/spark", icon: Flame, label: "Chispa", description: "Encuentra tu próxima conexión" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.1] }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6"
          >
            <KikiLogo size="xl" />
          </motion.div>

          {/* 404 Number with Heart */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-block mb-4"
          >
            <span className="text-8xl sm:text-9xl font-black text-primary/20 select-none">
              4
              <span className="text-primary animate-pulse">♥</span>
              4
            </span>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
              ¡Ups! Página no encontrada
            </h1>
            <p className="font-body text-muted-foreground max-w-md mx-auto leading-relaxed">
              Parece que esta chispa se ha apagado. La página que buscas no existe o ha sido movida.
            </p>
          </motion.div>
        </motion.div>

        {/* Quick Navigation */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full max-w-md space-y-3 mb-8"
        >
          <p className="text-sm text-muted-foreground text-center mb-4">
            ¿Qué te gustaría hacer?
          </p>
          
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.to}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
            >
              <Link to={link.to}>
                <Card 
                  interactive 
                  className="group hover:border-primary/50 transition-all duration-300"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                        {link.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver atrás
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NotFound;
