import { Shield, RefreshCw, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

interface AdminHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  softDarkMode?: boolean;
  onToggleSoftDark?: (enabled: boolean) => void;
}

const AdminHeader = ({ onRefresh, isRefreshing, softDarkMode, onToggleSoftDark }: AdminHeaderProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

          <div className="flex items-center gap-4">
            {/* Soft Dark Mode Toggle - Only visible in dark mode */}
            {isDark && onToggleSoftDark && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="soft-dark" className="text-xs font-medium text-muted-foreground cursor-pointer whitespace-nowrap">
                  Modo suave
                </Label>
                <Switch
                  id="soft-dark"
                  checked={softDarkMode}
                  onCheckedChange={onToggleSoftDark}
                  className="scale-90"
                />
              </div>
            )}

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
