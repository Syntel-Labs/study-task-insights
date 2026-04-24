import { useEffect, useMemo, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";

type Props = {
  limit?: number;
  offset?: number;
  total?: number;
  onChangeLimit?: (n: number) => void;
  onChangeOffset?: (n: number) => void;
  limitOptions?: number[];
};

export default function PaginationControls({
  limit = 20,
  offset = 0,
  total = 0,
  onChangeLimit,
  onChangeOffset,
  limitOptions = [10, 20, 50, 100, 200],
}: Props) {
  const { page, pages } = useMemo(() => {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 1));
    const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / safeLimit));
    const currentPage = Math.min(totalPages, Math.max(1, Math.floor((Number(offset) || 0) / safeLimit) + 1));
    return { page: currentPage, pages: totalPages };
  }, [limit, offset, total]);

  const [pageInput, setPageInput] = useState<number | string>(page);
  useEffect(() => setPageInput(page), [page]);

  function goToPage(p: number | string) {
    const target = Math.max(1, Math.min(pages, Number(p) || 1));
    const newOffset = (target - 1) * Math.max(1, Math.min(200, Number(limit) || 1));
    onChangeOffset?.(newOffset);
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 py-2" aria-label="Paginación">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Por página</span>
        <Select value={String(limit)} onValueChange={(v) => onChangeLimit?.(Number(v))}>
          <SelectTrigger size="sm" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={page <= 1} aria-label="Primera página">
          <ChevronFirst className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Anterior">
          <ChevronLeft className="size-4" />
        </Button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToPage(pageInput);
          }}
          className="flex items-center gap-1 px-2"
        >
          <span className="text-muted-foreground text-sm">Página</span>
          <Input
            type="number"
            min={1}
            max={pages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="h-9 w-16"
          />
          <span className="text-muted-foreground text-sm">de {pages}</span>
        </form>

        <Button variant="outline" size="icon" onClick={() => goToPage(page + 1)} disabled={page >= pages} aria-label="Siguiente">
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => goToPage(pages)} disabled={page >= pages} aria-label="Última página">
          <ChevronLast className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
