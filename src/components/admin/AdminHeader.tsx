import { Shield, Settings, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AdminHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const AdminHeader = ({ onRefresh, isRefreshing }: AdminHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 
                className="text-2xl font-black text-foreground tracking-tight"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
              >
                Panel de Admin
              </h1>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
                Gestión y moderación de KIKI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-10 w-10"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHeader;
