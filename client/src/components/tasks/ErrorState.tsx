import { AlertCircle } from "lucide-react";
import { Button } from "@components/ui/button";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  message = "Ocurrió un error al cargar las tareas.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertCircle className="text-destructive size-10" />
      <h3 className="text-foreground text-lg font-semibold">Error</h3>
      <p className="text-muted-foreground text-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Reintentar
        </Button>
      )}
    </div>
  );
}
