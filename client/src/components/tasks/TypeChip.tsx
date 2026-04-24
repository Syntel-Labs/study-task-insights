import { Badge } from "@components/ui/badge";

type TypeLike = { name?: string } | null | undefined;

export default function TypeChip({ type }: { type: TypeLike }) {
  return (
    <Badge variant="outline" className="border-primary/40 text-primary/90 bg-background font-medium">
      {type?.name || "—"}
    </Badge>
  );
}
