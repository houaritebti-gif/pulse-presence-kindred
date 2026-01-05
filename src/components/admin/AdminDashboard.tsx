import { Users, Flag, Camera, UserCog, TrendingUp, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import AdminStatsCard from "./AdminStatsCard";
import { motion } from "framer-motion";

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingReports: number;
  pendingVerifications: number;
  newUsersThisWeek: number;
  totalRoles: number;
}

interface AdminDashboardProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

const AdminDashboard = ({ stats, isLoading }: AdminDashboardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Quick Actions Banner */}
      {(stats.pendingReports > 0 || stats.pendingVerifications > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
                Acciones pendientes
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.pendingReports > 0 && `${stats.pendingReports} reportes`}
                {stats.pendingReports > 0 && stats.pendingVerifications > 0 && " · "}
                {stats.pendingVerifications > 0 && `${stats.pendingVerifications} verificaciones`}
                {" requieren tu atención"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          icon={<Users className="w-4 h-4 text-primary" />}
          value={stats.totalUsers}
          label="Usuarios totales"
          trend={`+${stats.newUsersThisWeek} esta semana`}
          trendColor="emerald"
          variant="highlight"
        />
        <AdminStatsCard
          icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
          value={stats.verifiedUsers}
          label="Verificados"
          trend={stats.totalUsers > 0 ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}% del total` : "0%"}
          trendColor="primary"
        />
        <AdminStatsCard
          icon={<Flag className="w-4 h-4 text-destructive" />}
          value={stats.pendingReports}
          label="Reportes pendientes"
          trendColor={stats.pendingReports > 0 ? "destructive" : "muted"}
        />
        <AdminStatsCard
          icon={<Camera className="w-4 h-4 text-amber-500" />}
          value={stats.pendingVerifications}
          label="Verificaciones pendientes"
          trendColor={stats.pendingVerifications > 0 ? "amber" : "muted"}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatsCard
          icon={<UserCog className="w-4 h-4 text-muted-foreground" />}
          value={stats.totalRoles}
          label="Roles asignados"
        />
        <AdminStatsCard
          icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
          value={stats.newUsersThisWeek}
          label="Nuevos esta semana"
        />
        <AdminStatsCard
          icon={<Activity className="w-4 h-4 text-muted-foreground" />}
          value={`${stats.verifiedUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%`}
          label="Tasa verificación"
        />
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
