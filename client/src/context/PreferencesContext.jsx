import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { changeLang, SUPPORTED_LANGS } from "../i18n";

const PreferencesContext = createContext(null);

const THEME_KEY = "stia_theme";
const SUPPORTED_THEMES = ["light", "dark"];

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (SUPPORTED_THEMES.includes(v)) return v;
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function applyThemeAttr(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
}

export function PreferencesProvider({ children }) {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState(readTheme);
  const [lang, setLang] = useState(i18n.language || "es");

  useEffect(() => {
    applyThemeAttr(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    const onLangChanged = (lng) => setLang(lng);
    i18n.on("languageChanged", onLangChanged);
    return () => i18n.off("languageChanged", onLangChanged);
  }, [i18n]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    changeLang(newLang);
    setLang(newLang);
  }, []);

  const value = useMemo(
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

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
