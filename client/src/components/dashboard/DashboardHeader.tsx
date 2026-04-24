import { useTranslation } from "react-i18next";
import { RefreshCw, LineChart } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

type Props = {
  limitWeeks: number;
  setLimitWeeks: (n: number) => void;
  updating: boolean;
  onRefresh: () => void;
  lastUpdate: Date | null;
};

export default function DashboardHeader({ limitWeeks, setLimitWeeks, updating, onRefresh, lastUpdate }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "es";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-foreground flex items-center gap-2 text-2xl font-semibold">
          <LineChart className="text-primary size-5" />
          {t("dashboard.title")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("dashboard.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="weeks" className="text-xs">
            {t("dashboard.weeksLabel")}
          </Label>
          <Input
            id="weeks"
            type="number"
            min={1}
            max={52}
            value={limitWeeks}
            onChange={(e) => setLimitWeeks(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
            className="h-9 w-24"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Button onClick={onRefresh} disabled={updating} size="sm">
            <RefreshCw className={`size-4 ${updating ? "animate-spin" : ""}`} />
            {updating ? t("dashboard.refreshing") : t("dashboard.refresh")}
          </Button>
          {lastUpdate && (
            <span className="text-muted-foreground text-xs">
              {t("dashboard.updatedAt", {
                time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(lastUpdate),
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
