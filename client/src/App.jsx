import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NotFoundPage from "@pages/NotFoundPage.jsx";
import LoginPage from "@pages/LoginPage.jsx";

function HomePage() {
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Rutas futuras: /dashboard, /tasks, /sessions, etc. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
