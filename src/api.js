import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('onrender.com'))
  ? import.meta.env.VITE_API_URL
  : '/api';
const RESET_SECRET = import.meta.env.VITE_RESET_SECRET;

const API = axios.create({ baseURL: API_BASE });

API.interceptors.request.use((config) => {
  // Check for seller token first, then admin token
  const sellerToken = localStorage.getItem('seller_token');
  const adminToken = localStorage.getItem('aura_token');
  const token = sellerToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Only clear stale tokens on protected route failures, not on login/reset attempts
      if (!url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/seller/reset-password')) {
        localStorage.removeItem('seller_token');
        localStorage.removeItem('aura_token');
      }
    }
    return Promise.reject(error);
  }
);

export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getById: (id) => API.get(`/products/${id}`),
  create: (formData) => API.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => API.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/products/${id}`),
  uploadImages: (files) => {
    const fd = new FormData();
    Array.from(files).forEach((f, idx) => fd.append('images', f, f.name));
    return API.post('/products/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const categoryAPI = {
  getAll: () => API.get('/categories'),
  getById: (id) => API.get(`/categories/${id}`),
  create: (formData) => API.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => API.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/categories/${id}`)
};

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (data) => API.post('/auth/register', data),
  sendOTP: (phone) => API.post('/auth/otp/send', { phone }),
  verifyOTP: (data) => API.post('/auth/otp/verify', data),
  verify: () => API.get('/auth/verify'),
  resetSellerPassword: (data) => API.post('/auth/seller/reset-password', data),
  resetAdmin: () => API.post('/auth/reset-admin', {}, { headers: { 'x-reset-secret': RESET_SECRET || 'ZsDQ0StqpU8zXegoiWx2bGYAPhTkOVRdc7LwuJ13E64INjFM5lCy9avHnrBfKm' } }),
};

export const shopAPI = {
  getAll: () => API.get('/shops'),
  getBySlug: (slug) => API.get(`/shops/${slug}`),
  getProducts: (slug, params) => API.get(`/shops/${slug}/products`, { params }),
  getMy: () => API.get('/shops/my'),
  create: (data) => API.post('/shops', data),
  update: (id, data) => API.put(`/shops/${id}`, data),
  uploadLogo: (id, formData) => API.post(`/shops/${id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCover: (id, formData) => API.post(`/shops/${id}/cover`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProfileImage: (id, formData) => API.post(`/shops/${id}/profile-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const sellerAPI = {
  dashboard: () => API.get('/seller/dashboard'),
  getProducts: (params) => API.get('/seller/products', { params }),
  createProduct: (formData) => API.post('/seller/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, formData) => API.put(`/seller/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => API.delete(`/seller/products/${id}`),
  uploadImages: (files) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f, f.name));
    return API.post('/seller/products/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const paymentAPI = {
  subscribe: () => API.post('/payments/subscribe'),
  getMyPayments: () => API.get('/payments/my'),
  getStatus: (id) => API.get(`/payments/${id}/status`),
  verifyBakong: (id) => API.post(`/payments/${id}/verify-bakong`),
  verify: (id) => API.post(`/payments/${id}/verify`),
  getAll: (params) => API.get('/payments', { params }),
};

export const orderAPI = {
  create: (data) => API.post('/orders', data),
  getById: (id) => API.get(`/orders/${id}`),
  verifyBakong: (id) => API.post(`/orders/${id}/verify-bakong`),
  getSellerOrders: (params) => API.get('/orders/seller/my-orders', { params }),
  updateStatus: (id, data) => API.put(`/orders/seller/${id}/status`, data),
};

export const adminAPI = {
  dashboard: () => API.get('/admin/dashboard'),
  getSellers: (params) => API.get('/admin/sellers', { params }),
  getPendingShops: () => API.get('/admin/shops/pending'),
  approveShop: (id) => API.put(`/admin/shops/${id}/approve`),
  suspendShop: (id) => API.put(`/admin/shops/${id}/suspend`),
  reactivateShop: (id) => API.put(`/admin/shops/${id}/reactivate`),
};

export const buyerAPI = {
  requestOTP: (phone) => API.post('/buyer/request-otp', { phone }),
  verifyOTP: (phone, otp) => API.post('/buyer/verify-otp', { phone, otp }),
  checkToken: (buyerToken) => API.post('/buyer/check-token', { buyerToken }),
};

export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

export default API;
