import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import POS from "./pages/POS";
import Dashboard from "./pages/Dashboard";
import Revenue from "./pages/Revenue";
import MenuAdminPage from "./pages/MenuAdmin";
import OrderPage from "./pages/OrderPage";
import { isTokenValid, hasAdminRole, getUser } from "./api";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return isTokenValid(token) ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!isTokenValid(token)) return <Navigate to="/login" replace />;
  if (!hasAdminRole()) return <Navigate to="/pos" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/pos"
          element={
            <PrivateRoute>
              <POS />
            </PrivateRoute>
          }
        />

        <Route
          path="/revenue"
          element={
            <PrivateRoute>
              <Revenue />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/menu"
          element={
            <AdminRoute>
              <MenuAdminPage />
            </AdminRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <OrderPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}
