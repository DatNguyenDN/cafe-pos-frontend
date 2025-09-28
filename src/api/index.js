// src/api/index.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Request interceptor: attach token
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ========== Auth ==========
export async function login(credentials) {
  const r = await api.post("/auth/login", credentials);
  // console.log("Login response:", r.data);
  return r.data;
}

// ========== Menu / Products ==========
export async function fetchProducts(params) {
  // BE hiện đang expose menu tại /menu
  return api.get("/menu", { params }).then((r) => r.data);
}

// CREATE
export async function createMenuItem(data) {
  const token = getToken();
  return api.post('/menu', data, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.data);
}

// UPDATE
export async function updateMenuItem(id, data) {
  const token = getToken();
  return api.put(`/menu/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.data);
}

// DELETE
export async function deleteMenuItem(id) {
  const token = getToken();
  return api.delete(`/menu/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.data);
}

// ========== Tables ==========
export async function fetchTables(params) {
  return api.get("/tables", { params }).then((r) => r.data);
}

export async function getTable(id) {
  return api.get(`/tables/${id}`).then((r) => r.data);
}

export async function createTable(name) {
  return api.post("/tables", { name }).then((r) => r.data);
}

export async function setTableAvailability(id, isAvailable) {
  return api
    .patch(`/tables/${id}/availability`, { isAvailable })
    .then((r) => r.data);
}

// ========== Orders ==========
/**
 * Lấy các order theo bàn
 * GET /orders/table/:tableId
 */
export async function fetchOrdersByTable(tableId) {
  return api.get(`/orders/table/${tableId}`).then((r) => r.data);
}

/**
 * Lấy tất cả orders (có thể sort asc|desc)
 * GET /orders?sort=asc
 */
export async function fetchOrders(params = {}) {
  return api.get("/orders", { params }).then((r) => r.data);
}

/**
 * Tạo order mới cho bàn
 * POST /orders
 * body: { tableId: number, items: { menuItemId:number, quantity:number }[] }
 */
export async function createOrder({ tableId, items }) {
  return api.post("/orders", { tableId, items }).then((r) => r.data);
}

/**
 * Cập nhật order hiện có
 * PATCH /orders/:id
 * body: { items: { menuItemId:number, quantity:number }[] }
 */
export async function updateOrder(orderId, items) {
  return api.patch(`/orders/${orderId}`, { items }).then((r) => r.data);
}

// Lấy order đang hoạt động (pending) của 1 bàn
export async function getActiveOrderByTable(tableId) {
  return api.get(`/orders/table/${tableId}/active`).then((r) => r.data);
}

// Lấy chi tiết 1 order (nếu cần refetch)
export async function getOrder(orderId) {
  return api.get(`/orders/${orderId}`).then((r) => r.data);
}


/**
 * Thanh toán (pay) order
 * PATCH /orders/:id/pay
 */
export async function payOrder(orderId) {
  return api.patch(`/orders/${orderId}/pay`).then((r) => r.data);
}

export async function cancelOrder(orderId, reason) {
  return api.post(`/orders/${orderId}/cancel`, { reason }).then((r) => r.data);
}



// ========== Customers (giữ nguyên) ==========
export async function fetchCustomers(q) {
  return api.get("/customers", { params: { q } }).then((r) => r.data);
}

// ========== Tính tổng doanh thu ==========
export async function getRevenue(params = {}) {
  return api.get('/orders/revenue', { params }).then(r => r.data);
}





export default api;
