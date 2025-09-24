import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import POS from "./pages/POS";
import Dashboard from "./pages/Dashboard";
import Revenue from "./pages/Revenue";
import MenuAdminPage from "./pages/MenuAdmin"; // thư mục có index.jsx xuất default
import { isTokenValid, hasAdminRole, getToken } from "./utils/auth";


function PrivateRoute({ children }) {
    const token = getToken();
    return isTokenValid(token) ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
    const token = getToken();
    if (!isTokenValid(token)) return <Navigate to="/login" replace />;
    if (!hasAdminRole(token)) return <Navigate to="/pos" replace />;
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

                {/* Trang quản trị Menu - chỉ admin */}
                <Route
                    path="/admin/menu"
                    element={
                        <AdminRoute>
                            <MenuAdminPage />
                        </AdminRoute>
                    }
                />

                {/* (tuỳ chọn) Dashboard nếu bạn dùng */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/pos" replace />} />
            </Routes>
        </div>
    );
}
