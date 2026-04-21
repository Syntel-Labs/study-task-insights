import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "@components/PrivateRoute.jsx";
import AppLayout from "@components/AppLayout.jsx";
import LoginPage from "@pages/LoginPage.jsx";
import NotFoundPage from "@pages/NotFoundPage.jsx";
import DashboardPage from "@pages/DashboardPage.jsx";
import TasksPage from "@pages/TasksPage.jsx";
import LlmPage from "@pages/LlmPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/llm" element={<LlmPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
