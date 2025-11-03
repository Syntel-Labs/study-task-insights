import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { AuthProvider } from "@context/AuthContext.jsx";
import App from "./App.jsx";
import "@styles/fonts.css";
import "@styles/colors.css";

const theme = createTheme({
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
});

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            background: "var(--color-background)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-family-base)",
          },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
