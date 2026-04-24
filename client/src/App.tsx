import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "@components/PrivateRoute";
import AppLayout from "@components/AppLayout";
import LoginPage from "@pages/LoginPage";
import NotFoundPage from "@pages/NotFoundPage";
import DashboardPage from "@pages/DashboardPage.jsx";
import TasksPage from "@pages/TasksPage";
import LlmPage from "@pages/LlmPage";
import CatalogsPage from "@pages/CatalogsPage";
import { Toaster } from "@components/ui/sonner";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/catalogs" element={<CatalogsPage />} />
            <Route path="/llm" element={<LlmPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}
