import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AdminEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

const AdminEmptyState = ({ icon, title, description }: AdminEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <div className="text-muted-foreground opacity-50">
          {icon}
        </div>
      </div>
      <p className="font-semibold text-foreground mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default AdminEmptyState;
