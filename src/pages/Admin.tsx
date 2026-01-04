import { useState } from "react";
import { 
  Shield, Users, Flag, UserCog, Search, 
  MoreVertical, UserPlus, Trash2, Check, X, Clock, Ban, Plus, 
  Camera, Eye, ThumbsUp, ThumbsDown, TrendingUp, CheckCircle2, XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useUpdateIdentityVerification
} from "@/hooks/useAdminData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { AppRole } from "@/hooks/useUserRole";
import { 
  useBioBlacklist, 
  useAddBlacklistWord, 
  useRemoveBlacklistWord 
} from "@/hooks/useBioBlacklist";

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("moderator");
  const [newBlacklistWord, setNewBlacklistWord] = useState("");

  const { data: profiles, isLoading: loadingProfiles } = useAdminProfiles();
  const { data: reports, isLoading: loadingReports } = useAdminReports();
  const { data: roles, isLoading: loadingRoles } = useAdminUserRoles();
  const { data: blacklist, isLoading: loadingBlacklist } = useBioBlacklist();
  const { data: verifications, isLoading: loadingVerifications } = useAdminIdentityVerifications();
  const { data: verificationStats, isLoading: loadingStats } = useVerificationStats();
  const { data: chartData, isLoading: loadingChart } = useVerificationChartData();

  const addRoleMutation = useAddUserRole();
  const removeRoleMutation = useRemoveUserRole();
  const updateReportMutation = useUpdateReportStatus();
  const addBlacklistMutation = useAddBlacklistWord();
  const removeBlacklistMutation = useRemoveBlacklistWord();
  const updateVerificationMutation = useUpdateIdentityVerification();

  const [viewingSelfie, setViewingSelfie] = useState<string | null>(null);

  const filteredProfiles = profiles?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'reviewed':
        return <Badge variant="secondary"><Check className="w-3 h-3 mr-1" />Revisado</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500"><Check className="w-3 h-3 mr-1" />Resuelto</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="text-muted-foreground"><X className="w-3 h-3 mr-1" />Descartado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Panel de Admin</h1>
              <p className="text-xs text-muted-foreground">Gestión de usuarios y reportes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Reportes</span>
              {reports?.filter(r => r.status === 'pending').length ? (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {reports.filter(r => r.status === 'pending').length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Identidad</span>
              {verifications?.length ? (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {verifications.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="blacklist" className="gap-2">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Blacklist</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {loadingProfiles ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : filteredProfiles?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </div>
              ) : (
                filteredProfiles?.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{(profile.name?.[0] || '?').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{profile.name || 'Sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">{profile.city || 'Sin ciudad'}</p>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUserId(profile.user_id);
                          setAddRoleDialogOpen(true);
                        }}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Asignar rol
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {loadingReports ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-card rounded-lg border border-border">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : reports?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay reportes
              </div>
            ) : (
              reports?.map((report) => (
                <div key={report.id} className="p-4 bg-card rounded-lg border border-border space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={report.reported?.avatar_url || undefined} />
                        <AvatarFallback>{(report.reported?.name?.[0] || '?').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {report.reported?.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reportado por {report.reporter?.name || 'Usuario'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Motivo: {report.reason}</p>
                    {report.details && (
                      <p className="text-sm text-muted-foreground">{report.details}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </span>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                          >
                            Descartar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          >
                            Resolver
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            {loadingRoles ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : roles?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay roles asignados
              </div>
            ) : (
              roles?.map((roleEntry) => (
                <div key={roleEntry.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={roleEntry.profile?.avatar_url || undefined} />
                    <AvatarFallback>{(roleEntry.profile?.name?.[0] || '?').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {roleEntry.profile?.name || 'Usuario'}
                    </p>
                    <Badge variant={getRoleBadgeVariant(roleEntry.role)} className="mt-1">
                      {roleEntry.role === 'admin' ? 'Administrador' : 
                       roleEntry.role === 'moderator' ? 'Moderador' : 'Usuario'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {format(new Date(roleEntry.created_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveRole(roleEntry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
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
              />
              <Button 
                onClick={() => {
                  if (newBlacklistWord.trim()) {
                    addBlacklistMutation.mutate(newBlacklistWord);
                    setNewBlacklistWord("");
                  }
                }}
                disabled={!newBlacklistWord.trim() || addBlacklistMutation.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Las palabras de esta lista serán bloqueadas automáticamente en las bios de los perfiles. 
              Los chats privados no están afectados.
            </p>

            <div className="space-y-2">
              {loadingBlacklist ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))
              ) : blacklist?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay palabras en la blacklist
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {blacklist?.map((item) => (
                    <Badge 
                      key={item.id} 
                      variant="secondary" 
                      className="px-3 py-1.5 text-sm flex items-center gap-2"
                    >
                      {item.word}
                      <button
                        onClick={() => removeBlacklistMutation.mutate(item.id)}
                        className="hover:text-destructive transition-colors"
                        disabled={removeBlacklistMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
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
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border border-border">
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-2xl font-bold text-foreground">
                        {(verificationStats?.pending || 0) + (verificationStats?.manualReview || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-xs text-amber-500 mt-1">
                      +{verificationStats?.pendingLast7Days || 0} esta semana
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-2xl font-bold text-foreground">
                        {verificationStats?.approved || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Aprobadas</p>
                    <p className="text-xs text-emerald-500 mt-1">
                      +{verificationStats?.approvedLast7Days || 0} esta semana
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-2xl font-bold text-foreground">
                        {verificationStats?.rejected || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rechazadas</p>
                    <p className="text-xs text-destructive mt-1">
                      +{verificationStats?.rejectedLast7Days || 0} esta semana
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {verificationStats?.total || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total solicitudes</p>
                    <p className="text-xs text-primary mt-1">
                      {verificationStats?.approved && verificationStats?.total 
                        ? Math.round((verificationStats.approved / verificationStats.total) * 100)
                        : 0}% tasa de aprobación
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Chart Section */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Verificaciones últimos 30 días
              </h3>
              {loadingChart ? (
                <div className="h-48 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <ChartContainer
                  config={{
                    approved: {
                      label: "Aprobadas",
                      color: "hsl(142, 76%, 36%)",
                    },
                    rejected: {
                      label: "Rechazadas",
                      color: "hsl(var(--destructive))",
                    },
                  }}
                  className="h-48 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData || []}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="approved"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        dot={false}
                        name="Aprobadas"
                      />
                      <Line
                        type="monotone"
                        dataKey="rejected"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        dot={false}
                        name="Rechazadas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
              <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded bg-emerald-500" />
                  <span className="text-muted-foreground">Aprobadas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded bg-destructive" />
                  <span className="text-muted-foreground">Rechazadas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="w-4 h-4" />
              <span>Verificaciones pendientes de revisión manual (baja confianza de IA)</span>
            </div>

            {loadingVerifications ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-card rounded-lg border border-border">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-20 rounded-lg" />
                    <Skeleton className="w-20 h-20 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </div>
              ))
            ) : verifications?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay verificaciones pendientes</p>
              </div>
            ) : (
              verifications?.map((verification) => (
                <div key={verification.id} className="p-4 bg-card rounded-lg border border-border space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Profile Photo */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground text-center">Perfil</p>
                      <div 
                        className="w-20 h-20 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewingSelfie(verification.profile?.avatar_url || null)}
                      >
                        {verification.profile?.avatar_url ? (
                          <img 
                            src={verification.profile.avatar_url} 
                            alt="Foto de perfil" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Users className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selfie */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground text-center">Selfie</p>
                      <div 
                        className="w-20 h-20 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewingSelfie(verification.selfie_url)}
                      >
                        <img 
                          src={verification.selfie_url} 
                          alt="Selfie" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {verification.profile?.name || 'Sin nombre'}
                        </span>
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Revisión manual
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {verification.profile?.city || 'Sin ciudad'}
                      </p>
                      
                      {/* AI Analysis */}
                      <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Confianza IA:</span>
                          <Badge 
                            variant={verification.ai_confidence === 'high' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {verification.ai_confidence || 'N/A'}
                          </Badge>
                        </div>
                        {verification.ai_reason && (
                          <p className="text-muted-foreground italic">
                            "{verification.ai_reason}"
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Solicitado {format(new Date(verification.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-emerald-600 border-emerald-600 hover:bg-emerald-600/10"
                      onClick={() => {
                        updateVerificationMutation.mutate({
                          verificationId: verification.id,
                          profileId: verification.profile_id,
                          approved: true,
                        });
                        toast.success("Verificación aprobada");
                      }}
                      disabled={updateVerificationMutation.isPending}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        updateVerificationMutation.mutate({
                          verificationId: verification.id,
                          profileId: verification.profile_id,
                          approved: false,
                          rejectionReason: "Las fotos no coinciden según revisión manual",
                        });
                        toast.success("Verificación rechazada");
                      }}
                      disabled={updateVerificationMutation.isPending}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar rol</DialogTitle>
            <DialogDescription>
              Selecciona el rol que quieres asignar a este usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddRole} disabled={addRoleMutation.isPending}>
              {addRoleMutation.isPending ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selfie Lightbox */}
      <Dialog open={!!viewingSelfie} onOpenChange={() => setViewingSelfie(null)}>
        <DialogContent className="max-w-md p-2">
          {viewingSelfie && (
            <img 
              src={viewingSelfie} 
              alt="Vista ampliada" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;