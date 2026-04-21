import React, { useMemo } from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { usePreferences } from "@context/PreferencesContext.jsx";
import App from "./App.jsx";

export default function ThemedApp() {
  const { isDark } = usePreferences();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          primary: {
            main: isDark ? "#5c7ea3" : "#1b3b5f",
            light: "#99bffb",
            dark: "#15304a",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#f28c38",
            contrastText: "#ffffff",
          },
          success: { main: "#3d8361" },
          warning: { main: "#f5a524" },
          error: { main: "#c14953" },
          background: {
            default: isDark ? "#0f141b" : "#f7f9fc",
            paper: isDark ? "#121923" : "#ffffff",
          },
        },
        typography: {
          fontFamily: "var(--font-family-base)",
          h1: { fontFamily: "var(--font-family-heading)" },
          h2: { fontFamily: "var(--font-family-heading)" },
          h3: { fontFamily: "var(--font-family-heading)" },
          h4: { fontFamily: "var(--font-family-heading)" },
          h5: { fontFamily: "var(--font-family-heading)" },
          h6: { fontFamily: "var(--font-family-heading)" },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                transition: "background-color 200ms ease, box-shadow 200ms ease",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                transition: "transform 150ms ease, box-shadow 200ms ease",
                "&:hover": { transform: "translateY(-1px)" },
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                transition: "transform 180ms ease, background-color 180ms ease",
                "&:hover": { transform: "scale(1.06)" },
              },
            },
          },
          MuiModal: {
            defaultProps: {
              closeAfterTransition: true,
            },
          },
          MuiMenu: {
            defaultProps: {
              disableScrollLock: true,
            },
            styleOverrides: {
              paper: {
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                color: "var(--color-text-primary)",
                "&:hover": { backgroundColor: "var(--color-surface-2)" },
                "&.Mui-selected": {
                  backgroundColor: "var(--color-primary-weak)",
                  color: "var(--color-primary)",
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                backgroundImage: "none",
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: { color: "var(--color-text-secondary)" },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                color: "var(--color-text-primary)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--input-border)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--input-border-hover)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--input-border-focus)",
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              icon: { color: "var(--color-text-secondary)" },
            },
          },
        },
      }),
    [isDark]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            background: "var(--color-background)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-family-base)",
            transition: "background-color 240ms ease, color 240ms ease",
          },
          "*::-webkit-scrollbar": { width: "10px", height: "10px" },
          "*::-webkit-scrollbar-track": {
            background: "var(--color-surface-2)",
          },
          "*::-webkit-scrollbar-thumb": {
            background: "var(--neutral-400)",
            borderRadius: "8px",
          },
          "*::-webkit-scrollbar-thumb:hover": {
            background: "var(--neutral-500)",
          },
        }}
      />
      <App />
    </ThemeProvider>
  );
}
