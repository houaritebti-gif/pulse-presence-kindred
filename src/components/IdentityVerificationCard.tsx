import { useState, useRef } from "react";
import { Camera, CheckCircle, XCircle, Clock, Shield, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIdentityVerification, useSubmitIdentityVerification } from "@/hooks/useIdentityVerification";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const IdentityVerificationCard = () => {
  const { data: profile } = useProfile();
  const { data: verification, isLoading } = useIdentityVerification();
  const submitVerification = useSubmitIdentityVerification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await submitVerification.mutateAsync(selectedFile);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already verified
  if (profile?.identity_verified || verification?.status === "approved") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                Identidad verificada
              </p>
              <p className="text-sm text-muted-foreground">
                Tu perfil muestra el badge de verificación
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending verification
  if (verification?.status === "pending") {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Verificación en proceso
              </p>
              <p className="text-sm text-muted-foreground">
                Estamos revisando tu selfie
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected - can retry
  const wasRejected = verification?.status === "rejected";

  return (
    <Card className={cn(
      "border-border/50",
      wasRejected && "border-red-500/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Verificar identidad</CardTitle>
        </div>
        <CardDescription>
          Sube un selfie para verificar que eres tú. Tu perfil mostrará un badge de confianza.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {wasRejected && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Verificación no aprobada
                </p>
                {verification.rejection_reason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {verification.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-square w-48 mx-auto rounded-xl overflow-hidden border border-border">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={submitVerification.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitVerification.isPending}
              >
                {submitVerification.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verificar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-auto py-4 flex-col gap-2"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Tomar selfie</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                  fileInputRef.current.setAttribute("capture", "user");
                }
              }}
              className="h-auto py-4 flex-col gap-2"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">Subir foto</span>
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Tu selfie se compara automáticamente con tu foto de perfil usando IA
        </p>
      </CardContent>
    </Card>
  );
};

export default IdentityVerificationCard;
