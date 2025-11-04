import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "@components/PrivateRoute.jsx";
import AppLayout from "@components/AppLayout.jsx";
import LoginPage from "@pages/LoginPage.jsx";
import NotFoundPage from "@pages/NotFoundPage.jsx";
import DashboardPage from "@pages/DashboardPage.jsx";
import TasksPage from "@pages/TasksPage.jsx";
import LlmPage from "@pages/LlmPage.jsx";
// import StudySessionsPage from "@pages/StudySessionsPage.jsx";
// import ImportPage from "@pages/ImportPage.jsx";
// import CatalogsPage from "@pages/CatalogsPage";
// import ApiTestPage from "@pages/ApiTestPage";
// import ApiTestCatalogs from "@pages/ApiTestCatalogs.jsx";
// import ApiTestAuth from "@pages/ApiTestAuth.jsx";
// import ApiTestPrincipales from "@pages/ApiTestPrincipales.jsx";
// import ApiTestImport from "@pages/ApiTestImport.jsx";
// import ApiTestLlm from "@pages/ApiTestLlm.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          {/* <Route path="/apitest" element={<ApiTestPage />} />
          <Route path="/apitest/catalogs" element={<ApiTestCatalogs />} />
          <Route path="/apitest/auth" element={<ApiTestAuth />} />
          <Route path="/apitest/principales" element={<ApiTestPrincipales />} />
          <Route path="/apitest/import" element={<ApiTestImport />} /> */}
          {/* <Route path="/apitest/llm" element={<ApiTestLlm />} /> */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          {/* <Route path="/sessions" element={<StudySessionsPage />} /> */}
          {/* <Route path="/catalogs" element={<CatalogsPage />} /> */}
          <Route path="/llm" element={<LlmPage />} />
          {/* <Route path="/import" element={<ImportPage />} /> */}
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
