// src/api/index.js
import axios from "axios";

// Base URL: local dev hoặc production
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// Helper: lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token nếu có
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: có thể handle lỗi global
api.interceptors.response.use(
  res => res,
  err => {
    // Ví dụ: logout nếu token expired
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // nếu muốn redirect
    }
    return Promise.reject(err);
  }
);

export default api;

// ====== Auth ======
export const login = async (credentials) => {
  const res = await api.post("/auth/login", credentials);
  return res.data;
};

export const fetchProducts = async (params) => {
  const res = await api.get("/menu", { params });
  return res.data;
};

export const createMenuItem = async (data) => {
  const res = await api.post("/menu", data);
  return res.data;
};

export const updateMenuItem = async (id, data) => {
  const res = await api.put(`/menu/${id}`, data);
  return res.data;
};

export const deleteMenuItem = async (id) => {
  const res = await api.delete(`/menu/${id}`);
  return res.data;
};

// ====== Tables ======
export const fetchTables = async (params) => (await api.get("/tables", { params })).data;
export const getTable = async (id) => (await api.get(`/tables/${id}`)).data;
export const createTable = async (name) => (await api.post("/tables", { name })).data;
export const setTableAvailability = async (id, isAvailable) =>
  (await api.patch(`/tables/${id}/availability`, { isAvailable })).data;

// ====== Orders ======
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
export const getOrder = async (orderId) => (await api.get(`/orders/${orderId}`)).data;
export const payOrder = async (orderId) =>
  (await api.patch(`/orders/${orderId}/pay`)).data;
export const cancelOrder = async (orderId, reason) =>
  (await api.post(`/orders/${orderId}/cancel`, { reason })).data;

// ====== Customers ======
export const fetchCustomers = async (q) =>
  (await api.get("/customers", { params: { q } })).data;

// ====== Revenue ======
export const getRevenue = async (params = {}) =>
  (await api.get('/orders/revenue', { params })).data;
