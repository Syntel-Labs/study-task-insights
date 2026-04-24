import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { changeLang, SUPPORTED_LANGS } from "../i18n";

type Theme = "light" | "dark";
type Lang = string;

type PreferencesValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  lang: Lang;
  setLanguage: (l: Lang) => void;
  supportedLangs: string[];
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

const THEME_KEY = "stia_theme";
const SUPPORTED_THEMES: Theme[] = ["light", "dark"];

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY) as Theme | null;
    if (v && SUPPORTED_THEMES.includes(v)) return v;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [lang, setLang] = useState<Lang>((i18n.language as Lang) || "es");

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const onLangChanged = (lng: string) => setLang(lng as Lang);
    i18n.on("languageChanged", onLangChanged);
    return () => i18n.off("languageChanged", onLangChanged);
  }, [i18n]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setLanguage = useCallback((newLang: Lang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    changeLang(newLang);
    setLang(newLang);
  }, []);

  const value = useMemo<PreferencesValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
      lang,
      setLanguage,
      supportedLangs: SUPPORTED_LANGS,
    }),
    [theme, toggleTheme, lang, setLanguage]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
