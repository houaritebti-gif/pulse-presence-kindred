import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Camera, LogOut, Loader2, Volume2, VolumeX, Bell, BellOff, Smartphone, Send, Vibrate, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useProfileTribes, useUpdateProfile, useUpdateTribes } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { toast } from "sonner";
import { requestNotificationPermission, getNotificationPermission } from "@/utils/browserNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendPushNotification } from "@/utils/pushNotifications";
import { isVibrationEnabled, setVibrationEnabled, isDndEnabled, setDndEnabled, getDndHours, setDndHours } from "@/utils/notificationSound";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VIBES = ["Tranqui", "Intensa", "Curiosa", "Misteriosa", "Libre"];
const TRIBES = ["Queer", "Artista", "Nómada", "Foodie", "Noctámbula", "Indie"];

const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: tribes } = useProfileTribes(profile?.id);
  const updateProfile = useUpdateProfile();
  const updateTribes = useUpdateTribes();
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [soundMuted, setSoundMutedState] = useState(() => {
    return localStorage.getItem("kiki_sound_muted") === "true";
  });
  const [vibrationEnabled, setVibrationEnabledState] = useState(() => {
    return isVibrationEnabled();
  });
  const [dndEnabled, setDndEnabledState] = useState(() => isDndEnabled());
  const [dndStart, setDndStart] = useState(() => getDndHours().start);
  const [dndEnd, setDndEnd] = useState(() => getDndHours().end);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(() => {
    return getNotificationPermission();
  });
  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush 
  } = usePushNotifications();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestPush = async () => {
    if (!profile?.id) {
      toast.error("No se encontró tu perfil");
      return;
    }
    setIsSendingTest(true);
    try {
      await sendPushNotification({
        profileId: profile.id,
        title: "🎉 Push de prueba",
        body: "¡Las notificaciones push funcionan correctamente!",
        url: "/profile",
      });
      toast.success("Push enviado - revisa tus notificaciones");
    } catch (error) {
      toast.error("Error al enviar push de prueba");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSoundToggle = (muted: boolean) => {
    setSoundMutedState(muted);
    localStorage.setItem("kiki_sound_muted", muted ? "true" : "false");
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabledState(enabled);
    setVibrationEnabled(enabled);
    if (enabled && "vibrate" in navigator) {
      navigator.vibrate([50, 30, 50]); // Quick feedback
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    if (granted) {
      toast.success("Notificaciones activadas");
    } else {
      toast.error("Permisos de notificación denegados");
    }
  };

  const handlePushToggle = async () => {
    if (pushSubscribed) {
      const success = await unsubscribePush();
      if (success) {
        toast.success("Push notifications desactivadas");
      } else {
        toast.error("Error al desactivar push notifications");
      }
    } else {
      const success = await subscribePush();
      if (success) {
        toast.success("Push notifications activadas - recibirás notificaciones aunque cierres la app");
      } else {
        toast.error("Error al activar push notifications");
      }
    }
  };

  // Load existing data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCity(profile.city || "Madrid");
      setSelectedVibe(profile.vibe);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newUrl = await uploadAvatar(file);
      setAvatarUrl(newUrl);
      toast.success("Foto actualizada");
    } catch (error: any) {
      toast.error(error.message || "Error al subir la foto");
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  useEffect(() => {
    if (tribes) {
      setSelectedTribes(tribes.map(t => t.tribe));
    }
  }, [tribes]);

  const toggleTribe = (tribe: string) => {
    setHasChanges(true);
    setSelectedTribes(prev => 
      prev.includes(tribe) 
        ? prev.filter(t => t !== tribe)
        : [...prev, tribe]
    );
  };

  const handleContinue = async () => {
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        name: name || null,
        city: city || "Madrid",
        vibe: selectedVibe,
      });

      await updateTribes.mutateAsync({
        profileId: profile.id,
        tribes: selectedTribes,
      });

      toast.success("Perfil guardado");
      navigate("/presence");
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Presencia</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <LogOut className="w-4 h-4" />
          <span>Salir</span>
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Tu perfil
          </h1>
          <p className="font-body text-muted-foreground text-sm">
            Solo lo esencial. Nada más.
          </p>
        </div>

        {/* Photo */}
        <div className="flex justify-center mb-10 animate-fade-up animate-delay-100">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button 
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="relative w-32 h-32 rounded-full bg-card flex items-center justify-center group transition-transform hover:scale-105 overflow-hidden"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-card-foreground/60 group-hover:text-card-foreground transition-colors" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <div className={`absolute inset-0 rounded-full border-2 transition-colors ${
              avatarUrl 
                ? "border-transparent group-hover:border-primary/50" 
                : "border-dashed border-card-foreground/20 group-hover:border-card-foreground/40"
            }`} />
            {avatarUrl && (
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 flex items-center justify-center transition-all">
                <Camera className="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </button>
        </div>

        {/* Name & City */}
        <div className="space-y-4 mb-10 animate-fade-up animate-delay-200">
          <Input
            type="text"
            placeholder="Tu nombre (o como quieras que te llamen)"
            value={name}
            onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Input
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={(e) => { setCity(e.target.value); setHasChanges(true); }}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
        </div>

        {/* Vibe */}
        <div className="mb-10 animate-fade-up animate-delay-300">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Tu vibra
          </h2>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(vibe => (
              <button
                key={vibe}
                onClick={() => { setSelectedVibe(vibe); setHasChanges(true); }}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  selectedVibe === vibe
                    ? "bg-card text-card-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Tribes */}
        <div className="mb-10 animate-fade-up animate-delay-400">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Tus tribus
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRIBES.map(tribe => (
              <button
                key={tribe}
                onClick={() => toggleTribe(tribe)}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  selectedTribes.includes(tribe)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {tribe}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="mb-6 animate-fade-up animate-delay-500">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Sonidos y notificaciones
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                {soundMuted ? (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-foreground" />
                )}
                <span className="font-body text-sm text-foreground">
                  {soundMuted ? "Sonidos silenciados" : "Sonidos activados"}
                </span>
              </div>
              <Switch
                checked={!soundMuted}
                onCheckedChange={(checked) => handleSoundToggle(!checked)}
              />
            </div>
            
            {"vibrate" in navigator && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Vibrate className={`w-5 h-5 ${vibrationEnabled ? "text-foreground" : "text-muted-foreground"}`} />
                  <span className="font-body text-sm text-foreground">
                    {vibrationEnabled ? "Vibración activada" : "Vibración desactivada"}
                  </span>
                </div>
                <Switch
                  checked={vibrationEnabled}
                  onCheckedChange={handleVibrationToggle}
                />
              </div>
            )}
            
            {notificationPermission !== null && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {notificationPermission === "granted" ? (
                    <Bell className="w-5 h-5 text-foreground" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-body text-sm text-foreground">
                    {notificationPermission === "granted" 
                      ? "Notificaciones del navegador activas" 
                      : "Notificaciones del navegador"}
                  </span>
                </div>
                {notificationPermission !== "granted" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRequestNotificationPermission}
                  >
                    Activar
                  </Button>
                )}
                {notificationPermission === "granted" && (
                  <span className="text-xs text-primary font-body">Activas</span>
                )}
              </div>
            )}
            
            {/* Push Notifications - PWA */}
            {pushSupported && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className={`w-5 h-5 ${pushSubscribed ? "text-foreground" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-body text-sm text-foreground block">
                      {pushSubscribed ? "Push activado" : "Push notifications"}
                    </span>
                    <span className="font-body text-xs text-muted-foreground">
                      Recibe alertas con la app cerrada
                    </span>
                  </div>
                </div>
                <Switch
                  checked={pushSubscribed}
                  onCheckedChange={handlePushToggle}
                  disabled={pushLoading}
                />
              </div>
            )}
            
            {/* Test Push Button */}
            {pushSubscribed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPush}
                disabled={isSendingTest}
                className="w-full flex items-center gap-2"
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Probar push notification
              </Button>
            )}
            
            {/* Do Not Disturb */}
            <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className={`w-5 h-5 ${dndEnabled ? "text-foreground" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-body text-sm text-foreground block">
                      No molestar
                    </span>
                    <span className="font-body text-xs text-muted-foreground">
                      Silencia notificaciones en horario
                    </span>
                  </div>
                </div>
                <Switch
                  checked={dndEnabled}
                  onCheckedChange={(enabled) => {
                    setDndEnabledState(enabled);
                    setDndEnabled(enabled);
                  }}
                />
              </div>
              
              {dndEnabled && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <Select
                    value={dndStart.toString()}
                    onValueChange={(val) => {
                      const start = parseInt(val, 10);
                      setDndStart(start);
                      setDndHours(start, dndEnd);
                    }}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">a</span>
                  <Select
                    value={dndEnd.toString()}
                    onValueChange={(val) => {
                      const end = parseInt(val, 10);
                      setDndEnd(end);
                      setDndHours(dndStart, end);
                    }}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="mt-6 animate-fade-up animate-delay-600">
          <Button 
            variant="kiki" 
            size="lg" 
            className="w-full"
            onClick={handleContinue}
            disabled={updateProfile.isPending || updateTribes.isPending}
          >
            {updateProfile.isPending ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Profile;
