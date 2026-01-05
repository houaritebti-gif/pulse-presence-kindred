import { Shield, RefreshCw } from "lucide-react";
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
      className="bg-card/95 backdrop-blur-md border-b-2 border-border sticky top-0 z-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Panel de Admin
              </h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
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
                className="h-11 w-11 border-2"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHeader;
