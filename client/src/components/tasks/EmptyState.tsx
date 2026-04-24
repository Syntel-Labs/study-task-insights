import { Button } from "@components/ui/button";
import { FolderSearch } from "lucide-react";

type Props = {
  title?: string;
  subtitle?: string;
  onCreate?: () => void;
};

export default function EmptyState({
  title = "No hay tareas que coincidan con los filtros",
  subtitle = "Crea una nueva tarea o ajusta tu búsqueda.",
  onCreate,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <FolderSearch className="text-muted-foreground size-10" />
      <h3 className="text-foreground text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
      {onCreate && (
        <Button onClick={onCreate} className="mt-2">
          Nueva tarea
        </Button>
      )}
    </div>
  );
}
