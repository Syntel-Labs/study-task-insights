import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@context/AuthContext.jsx";
import { useHealthApi } from "@hooks/api";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loading, isAuthenticated } = useAuth();
  const { check } = useHealthApi();
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [fieldTouched, setFieldTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const isEmptyError = fieldTouched && !secret.trim();

  function handleToggleShow() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? null;
    const end = el?.selectionEnd ?? null;
    setShowSecret((v) => !v);
    requestAnimationFrame(() => {
      const node = inputRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      if (start !== null && end !== null) {
        try {
          node.setSelectionRange(start, end);
        } catch {
          /* ignore */
        }
      }
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!secret.trim()) {
      setFieldTouched(true);
      return;
    }
    try {
      setSubmitting(true);
      try {
        await check();
      } catch (err) {
        const e = err as { payload?: { message?: string }; message?: string };
        toast.warning(e?.payload?.message || e?.message || "Servicio no disponible. Intenta en unos minutos.");
        return;
      }

      await login(secret.trim());
      toast.success("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (err) {
      const e = err as { status?: number; payload?: { message?: string }; message?: string };
      if (e?.status === 401) {
        toast.error("Verifica la clave e intenta de nuevo.");
      } else {
        toast.error(e?.payload?.message || e?.message || "Error de autenticación");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            {t("login.title", "Ingresa la clave para continuar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">{t("login.label", "Clave de acceso")}</Label>
              <div className="relative">
                <Input
                  id="secret"
                  ref={inputRef}
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onBlur={() => setFieldTouched(true)}
                  disabled={submitting || loading}
                  autoFocus
                  autoComplete="current-password"
                  aria-invalid={isEmptyError}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={handleToggleShow}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={submitting || loading}
                  aria-label={showSecret ? "Ocultar clave" : "Mostrar clave"}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 transition-colors"
                >
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {isEmptyError && <p className="text-destructive text-xs">Este campo es obligatorio</p>}
            </div>

            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Verificando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
