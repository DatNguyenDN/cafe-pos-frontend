// src/api/index.js
import axios from "axios";

// Dynamic baseURL: lấy từ env, fallback local
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// Helper: lấy token JWT từ localStorage
const getToken = () => localStorage.getItem("token");

// Tạo instance axios
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: tự động gắn token nếu có
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle lỗi global
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      // window.location.href = '/login'; // redirect nếu muốn
    }
    return Promise.reject(err);
  }
);

// ===== Auth =====
export const login = async (credentials) => {
  const res = await api.post("/auth/login", credentials);
  return res.data;
};

// ===== Menu / Products =====
export const fetchProducts = async (params) =>
  (await api.get("/menu", { params })).data;

export const createMenuItem = async (data) =>
  (await api.post("/menu", data)).data;

export const updateMenuItem = async (id, data) =>
  (await api.put(`/menu/${id}`, data)).data;

export const deleteMenuItem = async (id) =>
  (await api.delete(`/menu/${id}`)).data;

// ===== Tables =====
export const fetchTables = async (params) =>
  (await api.get("/tables", { params })).data;

export const getTable = async (id) =>
  (await api.get(`/tables/${id}`)).data;

export const createTable = async (name) =>
  (await api.post("/tables", { name })).data;

export const setTableAvailability = async (id, isAvailable) =>
  (await api.patch(`/tables/${id}/availability`, { isAvailable })).data;

// ===== Orders =====
export const fetchOrdersByTable = async (tableId) =>
  (await api.get(`/orders/table/${tableId}`)).data;

export const fetchOrders = async (params = {}) =>
  (await api.get("/orders", { params })).data;

export const createOrder = async ({ tableId, items }) =>
  (await api.post("/orders", { tableId, items })).data;

export const updateOrder = async (orderId, items) =>
  (await api.patch(`/orders/${orderId}`, { items })).data;

export const getActiveOrderByTable = async (tableId) =>
  (await api.get(`/orders/table/${tableId}/active`)).data;

export const getOrder = async (orderId) =>
  (await api.get(`/orders/${orderId}`)).data;

export const payOrder = async (orderId) =>
  (await api.patch(`/orders/${orderId}/pay`)).data;

export const cancelOrder = async (orderId, reason) =>
  (await api.post(`/orders/${orderId}/cancel`, { reason })).data;

// ===== Customers =====
export const fetchCustomers = async (q) =>
  (await api.get("/customers", { params: { q } })).data;

// ===== Revenue =====
export const getRevenue = async (params = {}) =>
  (await api.get("/orders/revenue", { params })).data;

export default api;
