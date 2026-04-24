import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { cn } from "@lib/utils";

type Tone = "danger" | "warning" | "primary";

type Props = {
  open: boolean;
  title: string;
  message?: ReactNode;
  tone?: Tone;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (extraData?: { actualMin?: number }) => void;
  askActualMin?: boolean;
  defaultActualMin?: number;
  extraContent?: ReactNode;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  tone = "primary",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onClose,
  onConfirm,
  askActualMin = false,
  defaultActualMin = 0,
  extraContent,
}: Props) {
  const [actualMin, setActualMin] = useState<number | string>(defaultActualMin ?? 0);

  useEffect(() => {
    if (open) setActualMin(defaultActualMin ?? 0);
  }, [open, defaultActualMin]);

  const confirmClass =
    tone === "danger"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : tone === "warning"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : "";

  function handleConfirm() {
    const payload = askActualMin ? { actualMin: Number(actualMin) || 0 } : undefined;
    onConfirm?.(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {message && typeof message === "string" && <DialogDescription>{message}</DialogDescription>}
          {message && typeof message !== "string" && <div className="text-muted-foreground text-sm">{message}</div>}
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {askActualMin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="actual-min">Minutos reales (actual)</Label>
              <Input
                id="actual-min"
                type="number"
                min={0}
                step={1}
                value={actualMin}
                onChange={(e) => setActualMin(e.target.value)}
              />
            </div>
          )}
          {extraContent}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className={cn(confirmClass)}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
