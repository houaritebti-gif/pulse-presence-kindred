import { useState, useMemo } from "react";
import { 
  Shield, Users, Flag, UserCog, Search, 
  Trash2, Check, X, Clock, Ban, Plus, RefreshCw,
  Camera, Eye, ThumbsUp, ThumbsDown, TrendingUp, CheckCircle2, XCircle, History, ShieldCheck, HardDrive, Loader2, Download, Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  useAdminProfiles, 
  useAdminReports, 
  useAdminUserRoles,
  useAdminIdentityVerifications,
  useVerificationStats,
  useVerificationChartData,
  useAddUserRole,
  useRemoveUserRole,
  useUpdateReportStatus,
  useUpdateIdentityVerification,
  useForceReverification,
  useUserVerificationHistory,
  useTriggerCleanup,
  useCleanupHistory,
  CleanupStats,
} from "@/hooks/useAdminData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from "recharts";
import { AppRole } from "@/hooks/useUserRole";
import { 
  useBioBlacklist, 
  useAddBlacklistWord, 
  useRemoveBlacklistWord 
} from "@/hooks/useBioBlacklist";

// Admin Components
import AdminHeader from "@/components/admin/AdminHeader";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUserCard from "@/components/admin/AdminUserCard";
import AdminReportCard from "@/components/admin/AdminReportCard";
import AdminVerificationCard from "@/components/admin/AdminVerificationCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("moderator");
  const [newBlacklistWord, setNewBlacklistWord] = useState("");
  const [reverifyDialogOpen, setReverifyDialogOpen] = useState(false);
  const [selectedProfileForReverify, setSelectedProfileForReverify] = useState<{ id: string; name: string | null } | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProfileForHistory, setSelectedProfileForHistory] = useState<{ id: string; name: string | null } | null>(null);
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "resolved">("all");
  const [userFilter, setUserFilter] = useState<"all" | "verified" | "unverified">("all");
  const [softDarkMode, setSoftDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-soft-dark') === 'true';
    }
    return false;
  });

  const { data: profiles, isLoading: loadingProfiles, refetch: refetchProfiles } = useAdminProfiles();
  const { data: reports, isLoading: loadingReports, refetch: refetchReports } = useAdminReports();
  const { data: roles, isLoading: loadingRoles, refetch: refetchRoles } = useAdminUserRoles();
  const { data: blacklist, isLoading: loadingBlacklist } = useBioBlacklist();
  const { data: verifications, isLoading: loadingVerifications, refetch: refetchVerifications } = useAdminIdentityVerifications();
  const { data: verificationStats, isLoading: loadingStats } = useVerificationStats();
  const { data: chartData, isLoading: loadingChart } = useVerificationChartData();

  const addRoleMutation = useAddUserRole();
  const removeRoleMutation = useRemoveUserRole();
  const updateReportMutation = useUpdateReportStatus();
  const addBlacklistMutation = useAddBlacklistWord();
  const removeBlacklistMutation = useRemoveBlacklistWord();
  const updateVerificationMutation = useUpdateIdentityVerification();
  const forceReverificationMutation = useForceReverification();
  const { data: verificationHistory, isLoading: loadingHistory } = useUserVerificationHistory(selectedProfileForHistory?.id || null);
  const triggerCleanupMutation = useTriggerCleanup();
  const { data: cleanupHistory, isLoading: loadingCleanupHistory } = useCleanupHistory();
  
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupStats | null>(null);
  const [viewingSelfie, setViewingSelfie] = useState<string | null>(null);
  const [showCleanupHistory, setShowCleanupHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggleSoftDark = (enabled: boolean) => {
    setSoftDarkMode(enabled);
    localStorage.setItem('admin-soft-dark', String(enabled));
  };

  // Dashboard stats
  const dashboardStats = useMemo(() => ({
    totalUsers: profiles?.length || 0,
    verifiedUsers: profiles?.filter(p => p.identity_verified).length || 0,
    pendingReports: reports?.filter(r => r.status === 'pending').length || 0,
    pendingVerifications: verifications?.length || 0,
    newUsersThisWeek: profiles?.filter(p => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.created_at) > weekAgo;
    }).length || 0,
    totalRoles: roles?.length || 0,
  }), [profiles, reports, verifications, roles]);

  // Filtered data
  const filteredProfiles = useMemo(() => {
    let filtered = profiles || [];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (userFilter === "verified") {
      filtered = filtered.filter(p => p.identity_verified);
    } else if (userFilter === "unverified") {
      filtered = filtered.filter(p => !p.identity_verified);
    }
    
    return filtered;
  }, [profiles, searchTerm, userFilter]);

  const filteredReports = useMemo(() => {
    let filtered = reports || [];
    
    if (reportFilter === "pending") {
      filtered = filtered.filter(r => r.status === "pending");
    } else if (reportFilter === "resolved") {
      filtered = filtered.filter(r => r.status !== "pending");
    }
    
    return filtered;
  }, [reports, reportFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfiles(),
      refetchReports(),
      refetchRoles(),
      refetchVerifications(),
    ]);
    setIsRefreshing(false);
    toast.success("Datos actualizados");
  };

  const handleForceReverification = async () => {
    if (!selectedProfileForReverify) return;
    try {
      await forceReverificationMutation.mutateAsync({ profileId: selectedProfileForReverify.id });
      toast.success(`Re-verificación forzada para ${selectedProfileForReverify.name || 'usuario'}`);
      setReverifyDialogOpen(false);
      setSelectedProfileForReverify(null);
    } catch {
      toast.error("Error al forzar re-verificación");
    }
  };

  const handleTriggerCleanup = async () => {
    try {
      const result = await triggerCleanupMutation.mutateAsync();
      setLastCleanupResult(result);
      if (result.totalDeleted > 0) {
        toast.success(`Limpieza completada: ${result.totalDeleted} archivos eliminados`);
      } else {
        toast.info("No había archivos para limpiar");
      }
    } catch {
      toast.error("Error al ejecutar limpieza");
    }
  };

  const openReverifyDialog = (profileId: string, profileName: string | null) => {
    setSelectedProfileForReverify({ id: profileId, name: profileName });
    setReverifyDialogOpen(true);
  };

  const openHistoryDialog = (profileId: string, profileName: string | null) => {
    setSelectedProfileForHistory({ id: profileId, name: profileName });
    setHistoryDialogOpen(true);
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'manual_review':
        return <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" />Revisión manual</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddRole = async () => {
    if (!selectedUserId) return;
    
    try {
      await addRoleMutation.mutateAsync({ userId: selectedUserId, role: selectedRole });
      toast.success("Rol asignado correctamente");
      setAddRoleDialogOpen(false);
      setSelectedUserId(null);
    } catch {
      toast.error("Error al asignar rol");
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      await removeRoleMutation.mutateAsync(roleId);
      toast.success("Rol eliminado");
    } catch {
      toast.error("Error al eliminar rol");
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      await updateReportMutation.mutateAsync({ reportId, status });
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const exportUsers = () => {
    if (!profiles) return;
    const csv = [
      ['Nombre', 'Ciudad', 'Verificado', 'Fecha registro'].join(','),
      ...profiles.map(p => [
        p.name || 'Sin nombre',
        p.city || 'Sin ciudad',
        p.identity_verified ? 'Sí' : 'No',
        format(new Date(p.created_at), 'dd/MM/yyyy')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Exportación completada');
  };

  return (
    <div className={`admin-panel min-h-screen bg-background pb-20 ${softDarkMode ? 'admin-soft-dark' : ''}`}>
      <AdminHeader 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
        softDarkMode={softDarkMode}
        onToggleSoftDark={handleToggleSoftDark}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-14 p-1.5 bg-muted/60 border-2 border-border rounded-xl">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg font-semibold text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg font-semibold text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg font-semibold text-sm relative">
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Reportes</span>
              {dashboardStats.pendingReports > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-bold absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0">
                  {dashboardStats.pendingReports}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg font-semibold text-sm relative">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Identidad</span>
              {dashboardStats.pendingVerifications > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-bold absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0">
                  {dashboardStats.pendingVerifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg font-semibold text-sm">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="blacklist" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg font-semibold text-sm">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Blacklist</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard 
              stats={dashboardStats} 
              isLoading={loadingProfiles || loadingReports || loadingVerifications} 
            />

            {/* Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-card rounded-xl border-2 border-border"
            >
              <h3 className="text-base font-bold text-foreground mb-5">
                Verificaciones últimos 30 días
              </h3>
              {loadingChart ? (
                <div className="h-56 flex items-center justify-center">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ) : (
                <ChartContainer
                  config={{
                    approved: { label: "Aprobadas", color: "hsl(142, 76%, 36%)" },
                    rejected: { label: "Rechazadas", color: "hsl(var(--destructive))" },
                  }}
                  className="h-56 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData || []}>
                      <defs>
                        <linearGradient id="gradientApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradientRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        fill="url(#gradientApproved)"
                        name="Aprobadas"
                      />
                      <Area
                        type="monotone"
                        dataKey="rejected"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        fill="url(#gradientRejected)"
                        name="Rechazadas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
              <div className="flex items-center justify-center gap-8 mt-5 text-sm font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <span className="text-foreground/80">Aprobadas</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-destructive" />
                  <span className="text-foreground/80">Rechazadas</span>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex gap-2">
                <Select value={userFilter} onValueChange={(v) => setUserFilter(v as typeof userFilter)}>
                  <SelectTrigger className="w-[140px] h-11">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="verified">Verificados</SelectItem>
                    <SelectItem value="unverified">Sin verificar</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={exportUsers}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
              <span>{filteredProfiles.length} usuarios</span>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {loadingProfiles ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : filteredProfiles.length === 0 ? (
                  <AdminEmptyState
                    icon={<Users className="w-8 h-8" />}
                    title="No se encontraron usuarios"
                    description="Prueba con otros filtros o términos de búsqueda"
                  />
                ) : (
                  filteredProfiles.map((profile) => (
                    <AdminUserCard
                      key={profile.id}
                      profile={profile}
                      onAssignRole={(userId) => {
                        setSelectedUserId(userId);
                        setAddRoleDialogOpen(true);
                      }}
                      onViewHistory={(id, name) => openHistoryDialog(id, name)}
                      onForceReverify={(id, name) => openReverifyDialog(id, name)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={reportFilter} onValueChange={(v) => setReportFilter(v as typeof reportFilter)}>
                <SelectTrigger className="w-[160px] h-11">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los reportes</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="resolved">Resueltos</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredReports.length} reportes
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {loadingReports ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-5 bg-card rounded-xl border border-border">
                      <Skeleton className="h-4 w-48 mb-3" />
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))
                ) : filteredReports.length === 0 ? (
                  <AdminEmptyState
                    icon={<Flag className="w-8 h-8" />}
                    title="No hay reportes"
                    description={reportFilter === "pending" ? "No hay reportes pendientes de revisión" : undefined}
                  />
                ) : (
                  filteredReports.map((report) => (
                    <AdminReportCard
                      key={report.id}
                      report={report}
                      onUpdateStatus={handleUpdateReportStatus}
                      isUpdating={updateReportMutation.isPending}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
                Roles asignados
              </h3>
              <span className="text-sm text-muted-foreground">
                {roles?.length || 0} roles
              </span>
            </div>

            <div className="space-y-2">
              {loadingRoles ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                ))
              ) : roles?.length === 0 ? (
                <AdminEmptyState
                  icon={<UserCog className="w-8 h-8" />}
                  title="No hay roles asignados"
                  description="Asigna roles desde la pestaña de usuarios"
                />
              ) : (
                roles?.map((roleEntry) => (
                  <motion.div 
                    key={roleEntry.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all group"
                  >
                    <Avatar className="w-12 h-12 ring-2 ring-background shadow-sm">
                      <AvatarImage src={roleEntry.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(roleEntry.profile?.name?.[0] || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {roleEntry.profile?.name || 'Usuario'}
                      </p>
                      <Badge 
                        variant={getRoleBadgeVariant(roleEntry.role)} 
                        className="mt-1"
                      >
                        {roleEntry.role === 'admin' ? '👑 Administrador' : 
                         roleEntry.role === 'moderator' ? '🛡️ Moderador' : 'Usuario'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(roleEntry.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveRole(roleEntry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Blacklist Tab */}
          <TabsContent value="blacklist" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Añadir palabra prohibida..."
                value={newBlacklistWord}
                onChange={(e) => setNewBlacklistWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBlacklistWord.trim()) {
                    addBlacklistMutation.mutate(newBlacklistWord);
                    setNewBlacklistWord("");
                  }
                }}
                className="h-11"
              />
              <Button 
                onClick={() => {
                  if (newBlacklistWord.trim()) {
                    addBlacklistMutation.mutate(newBlacklistWord);
                    setNewBlacklistWord("");
                  }
                }}
                disabled={!newBlacklistWord.trim() || addBlacklistMutation.isPending}
                className="h-11 px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir
              </Button>
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                ⚠️ Las palabras de esta lista serán bloqueadas automáticamente en las bios de los perfiles. 
                Los chats privados no están afectados.
              </p>
            </div>

            <div className="space-y-2">
              {loadingBlacklist ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 rounded-full" />
                  ))}
                </div>
              ) : blacklist?.length === 0 ? (
                <AdminEmptyState
                  icon={<Ban className="w-8 h-8" />}
                  title="No hay palabras en la blacklist"
                  description="Añade palabras que quieras bloquear en las bios"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {blacklist?.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-destructive/10 transition-colors group"
                      >
                        {item.word}
                        <button
                          onClick={() => removeBlacklistMutation.mutate(item.id)}
                          className="opacity-50 group-hover:opacity-100 hover:text-destructive transition-all"
                          disabled={removeBlacklistMutation.isPending}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Identity Verifications Tab */}
          <TabsContent value="verifications" className="space-y-6">
            {/* Stats Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loadingStats ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 bg-card rounded-xl border border-border">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-2xl font-bold text-foreground">
                        {(verificationStats?.pending || 0) + (verificationStats?.manualReview || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-2xl font-bold text-foreground">
                        {verificationStats?.approved || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Aprobadas</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-2xl font-bold text-foreground">
                        {verificationStats?.rejected || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rechazadas</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {verificationStats?.total || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </motion.div>
                </>
              )}
            </div>

            {/* Storage Cleanup Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Limpieza de Storage
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Automático cada día a las 3 AM
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCleanupHistory(!showCleanupHistory)}
                  >
                    <History className="w-4 h-4 mr-1" />
                    Historial
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTriggerCleanup}
                    disabled={triggerCleanupMutation.isPending}
                  >
                    {triggerCleanupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Limpiando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Ejecutar ahora
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {lastCleanupResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mt-4">
                  <div className="text-center">
                    <span className="text-xl font-bold text-foreground">{lastCleanupResult.deletedFromCompletedVerifications}</span>
                    <p className="text-xs text-muted-foreground">De verificaciones</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold text-foreground">{lastCleanupResult.deletedOrphanedFiles}</span>
                    <p className="text-xs text-muted-foreground">Huérfanos</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold text-foreground">{lastCleanupResult.deletedOldVerifications}</span>
                    <p className="text-xs text-muted-foreground">Registros</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold text-emerald-500">{lastCleanupResult.totalDeleted}</span>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              )}

              {/* Cleanup History */}
              <AnimatePresence>
                {showCleanupHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 border-t border-border pt-4"
                  >
                    <h4 className="text-sm font-medium text-foreground mb-3">Historial de ejecuciones</h4>
                    {loadingCleanupHistory ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : cleanupHistory?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay historial de limpiezas
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cleanupHistory?.map((execution) => (
                          <div 
                            key={execution.id} 
                            className={`p-3 rounded-lg border ${
                              execution.success 
                                ? 'bg-muted/30 border-border' 
                                : 'bg-destructive/10 border-destructive/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {execution.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="text-sm font-medium">
                                  {format(new Date(execution.executed_at), "d MMM yyyy, HH:mm", { locale: es })}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {execution.triggered_by === 'cron' ? 'Auto' : 'Manual'}
                                </Badge>
                              </div>
                              {execution.duration_ms && (
                                <span className="text-xs text-muted-foreground">
                                  {(execution.duration_ms / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>
                            
                            {execution.success ? (
                              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                <span>Verif: {execution.deleted_from_completed}</span>
                                <span>Huérf: {execution.deleted_orphaned}</span>
                                <span>Reg: {execution.deleted_old_verifications}</span>
                                <span className="font-medium text-foreground">
                                  Total: {execution.total_deleted}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-destructive mt-1">
                                Error: {execution.error_message || 'Error desconocido'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pending Verifications */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="w-4 h-4" />
              <span>Verificaciones pendientes de revisión manual</span>
            </div>

            <div className="space-y-4">
              {loadingVerifications ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-5 bg-card rounded-xl border border-border">
                    <div className="flex gap-4">
                      <Skeleton className="w-24 h-24 rounded-xl" />
                      <Skeleton className="w-24 h-24 rounded-xl" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  </div>
                ))
              ) : verifications?.length === 0 ? (
                <AdminEmptyState
                  icon={<Camera className="w-8 h-8" />}
                  title="No hay verificaciones pendientes"
                  description="Todas las verificaciones han sido procesadas"
                />
              ) : (
                verifications?.map((verification) => (
                  <AdminVerificationCard
                    key={verification.id}
                    verification={verification}
                    onApprove={() => {
                      updateVerificationMutation.mutate({
                        verificationId: verification.id,
                        profileId: verification.profile_id,
                        approved: true,
                      });
                      toast.success("Verificación aprobada");
                    }}
                    onReject={() => {
                      updateVerificationMutation.mutate({
                        verificationId: verification.id,
                        profileId: verification.profile_id,
                        approved: false,
                        rejectionReason: "Las fotos no coinciden según revisión manual",
                      });
                      toast.success("Verificación rechazada");
                    }}
                    onViewImage={(url) => setViewingSelfie(url)}
                    isUpdating={updateVerificationMutation.isPending}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Asignar rol
            </DialogTitle>
            <DialogDescription>
              Selecciona el rol que quieres asignar a este usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">🛡️ Moderador</SelectItem>
                <SelectItem value="admin">👑 Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddRole} disabled={addRoleMutation.isPending}>
              {addRoleMutation.isPending ? 'Asignando...' : 'Asignar rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selfie Lightbox */}
      <Dialog open={!!viewingSelfie} onOpenChange={() => setViewingSelfie(null)}>
        <DialogContent className="max-w-lg p-2 bg-black/90">
          {viewingSelfie && (
            <img 
              src={viewingSelfie} 
              alt="Vista ampliada" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Force Re-verification Confirmation Dialog */}
      <AlertDialog open={reverifyDialogOpen} onOpenChange={setReverifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              ¿Forzar re-verificación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción invalidará la verificación de identidad de <strong>{selectedProfileForReverify?.name || 'este usuario'}</strong> y le notificará que debe volver a verificarse. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProfileForReverify(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleForceReverification}
              disabled={forceReverificationMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {forceReverificationMutation.isPending ? 'Procesando...' : 'Forzar re-verificación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={(open) => {
        setHistoryDialogOpen(open);
        if (!open) setSelectedProfileForHistory(null);
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de verificaciones
            </DialogTitle>
            <DialogDescription>
              {selectedProfileForHistory?.name || 'Usuario'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {loadingHistory ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : verificationHistory?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay historial de verificaciones
              </div>
            ) : (
              verificationHistory?.map((verification) => (
                <div key={verification.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    {getVerificationStatusBadge(verification.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(verification.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </span>
                  </div>
                  
                  {verification.ai_confidence && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Confianza IA:</span> {verification.ai_confidence}
                    </p>
                  )}
                  
                  {verification.ai_reason && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Razón IA:</span> {verification.ai_reason}
                    </p>
                  )}
                  
                  {verification.rejection_reason && (
                    <p className="text-xs text-destructive">
                      <span className="font-medium">Motivo rechazo:</span> {verification.rejection_reason}
                    </p>
                  )}
                  
                  {verification.verified_at && (
                    <p className="text-xs text-emerald-600">
                      <span className="font-medium">Verificado:</span> {format(new Date(verification.verified_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  )}
                  
                  {verification.selfie_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setViewingSelfie(verification.selfie_url)}
                      className="mt-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver selfie
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
