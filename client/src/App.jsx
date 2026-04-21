import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PrivateRoute from "@components/PrivateRoute.jsx";
import AppLayout from "@components/AppLayout.jsx";
import LoginPage from "@pages/LoginPage.jsx";
import NotFoundPage from "@pages/NotFoundPage.jsx";
import DashboardPage from "@pages/DashboardPage.jsx";
import TasksPage from "@pages/TasksPage.jsx";
import LlmPage from "@pages/LlmPage.jsx";
import CatalogsPage from "@pages/CatalogsPage.jsx";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22 } },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
            <Route path="/tasks" element={<AnimatedPage><TasksPage /></AnimatedPage>} />
            <Route path="/catalogs" element={<AnimatedPage><CatalogsPage /></AnimatedPage>} />
            <Route path="/llm" element={<AnimatedPage><LlmPage /></AnimatedPage>} />
          </Route>
        </Route>

        <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}
