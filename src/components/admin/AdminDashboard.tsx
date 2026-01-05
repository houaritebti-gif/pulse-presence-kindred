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
          className="p-5 rounded-xl bg-[hsl(45,90%,55%,0.12)] dark:bg-[hsl(45,90%,55%,0.08)] border-2 border-[hsl(45,90%,55%,0.35)] dark:border-[hsl(45,90%,55%,0.25)]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[hsl(45,90%,55%,0.2)] dark:bg-[hsl(45,90%,55%,0.15)] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-[hsl(45,90%,40%)] dark:text-[hsl(45,90%,65%)]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">
                Acciones pendientes
              </p>
              <p className="text-sm font-medium text-foreground/80">
                {stats.pendingReports > 0 && <span className="text-destructive dark:text-[hsl(0,65%,60%)] font-semibold">{stats.pendingReports} reportes</span>}
                {stats.pendingReports > 0 && stats.pendingVerifications > 0 && " · "}
                {stats.pendingVerifications > 0 && <span className="text-[hsl(45,90%,40%)] dark:text-[hsl(45,90%,65%)] font-semibold">{stats.pendingVerifications} verificaciones</span>}
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
          icon={<ShieldCheck className="w-5 h-5 text-[hsl(160,60%,45%)] dark:text-[hsl(160,70%,55%)]" />}
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
          icon={<Camera className="w-5 h-5 text-[hsl(45,90%,40%)] dark:text-[hsl(45,90%,65%)]" />}
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
