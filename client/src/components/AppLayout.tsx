import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gauge, ListChecks, FolderTree, Sparkles, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@context/AuthContext.jsx";
import { usePreferences } from "@context/PreferencesContext";
import { Button } from "@components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { cn } from "@lib/utils";

export default function AppLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { isDark, toggleTheme, lang, setLanguage } = usePreferences();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: Gauge },
    { to: "/tasks", label: t("nav.tasks"), icon: ListChecks },
    { to: "/catalogs", label: t("nav.catalogs"), icon: FolderTree },
    { to: "/llm", label: t("nav.llm"), icon: Sparkles },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={lang}
              onValueChange={(v) => v && setLanguage(v)}
            >
              <ToggleGroupItem value="es" className="w-12">ES</ToggleGroupItem>
              <ToggleGroupItem value="en" className="w-12">EN</ToggleGroupItem>
            </ToggleGroup>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="toggle theme">
                    {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isDark ? t("common.theme_light") : t("common.theme_dark")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="min-w-[6.5rem] justify-center">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
