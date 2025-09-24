// src/utils/auth.js

// Lấy token từ localStorage (đã thống nhất key "token")
export const getToken = () => localStorage.getItem('token') || null;

// Decode JWT (hỗ trợ base64url)
export function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// Kiểm tra hạn token (exp)
export function isTokenValid(token) {
  const p = parseJwt(token);
  if (!p) return false;
  const now = Math.floor(Date.now() / 1000);
  if (p.exp && p.exp < now) return false;
  return true;
}

// Kiểm tra role admin trong payload (role | roles[] | scope)
export function hasAdminRole(token) {
  const p = parseJwt(token);
  if (!p) return false;
  const roles = p.roles ?? p.role ?? p.scope;
  if (Array.isArray(roles)) return roles.includes('admin');
  if (typeof roles === 'string') {
    return roles === 'admin' || roles.split(/\s+/).includes('admin');
  }
  return false;
}

// Xoá thông tin đăng nhập (tuỳ chọn)
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
