import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div>
      <h1>404 — Página no encontrada</h1>
      <p>La ruta que intentas acceder no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
