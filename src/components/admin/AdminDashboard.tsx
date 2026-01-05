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
          <div key={i} className="h-36 bg-card rounded-xl border-2 border-border animate-pulse" />
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
          className="p-5 rounded-xl bg-amber-500/15 border-2 border-amber-500/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/25 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">
                Acciones pendientes
              </p>
              <p className="text-sm font-medium text-foreground/80">
                {stats.pendingReports > 0 && <span className="text-destructive font-semibold">{stats.pendingReports} reportes</span>}
                {stats.pendingReports > 0 && stats.pendingVerifications > 0 && " · "}
                {stats.pendingVerifications > 0 && <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.pendingVerifications} verificaciones</span>}
                {" requieren tu atención"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          icon={<Users className="w-5 h-5 text-primary" />}
          value={stats.totalUsers}
          label="Usuarios totales"
          trend={`+${stats.newUsersThisWeek} esta semana`}
          trendColor="emerald"
          variant="highlight"
        />
        <AdminStatsCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          value={stats.verifiedUsers}
          label="Verificados"
          trend={stats.totalUsers > 0 ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}% del total` : "0%"}
          trendColor="primary"
        />
        <AdminStatsCard
          icon={<Flag className="w-5 h-5 text-destructive" />}
          value={stats.pendingReports}
          label="Reportes pendientes"
          trendColor={stats.pendingReports > 0 ? "destructive" : "muted"}
        />
        <AdminStatsCard
          icon={<Camera className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          value={stats.pendingVerifications}
          label="Verificaciones pendientes"
          trendColor={stats.pendingVerifications > 0 ? "amber" : "muted"}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatsCard
          icon={<UserCog className="w-5 h-5 text-muted-foreground" />}
          value={stats.totalRoles}
          label="Roles asignados"
        />
        <AdminStatsCard
          icon={<TrendingUp className="w-5 h-5 text-muted-foreground" />}
          value={stats.newUsersThisWeek}
          label="Nuevos esta semana"
        />
        <AdminStatsCard
          icon={<Activity className="w-5 h-5 text-muted-foreground" />}
          value={`${stats.verifiedUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%`}
          label="Tasa verificación"
        />
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
