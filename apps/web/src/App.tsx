import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Missions from "./pages/Missions";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isLoading, user } = useAuth();

  if (isLoading) return null;

  return (
    <Routes>
      {/* Auth (não requer login) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* App principal (requer login) */}
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="missions" element={<Missions />} />
      </Route>

      {/* Redireciona raiz para dashboard ou login */}
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}
