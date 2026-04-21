import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@context/AuthContext.jsx";
import { PreferencesProvider } from "@context/PreferencesContext.jsx";
import ThemedApp from "./ThemedApp.jsx";
import "./i18n";
import "@styles/fonts.css";
import "@styles/colors.css";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <PreferencesProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </BrowserRouter>
    </PreferencesProvider>
  </React.StrictMode>
);
