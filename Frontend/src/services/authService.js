import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

// Separate instance for /superadmin/* routes (different URL prefix from /api)
const saApi = axios.create({
  baseURL: '/superadmin',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
saApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Public auth (/api/) ───────────────────────────────────────────────────────
export const registerUser = (data)         => axiosInstance.post('/register/', data);
export const loginUser    = (data)         => axiosInstance.post('/login/', data);
export const checkField   = (field, value) => axiosInstance.get('/check-field/', { params: { field, value } });

// ── User account ──────────────────────────────────────────────────────────────
export const logoutUser        = (data) => axiosInstance.post('/user/logout/', data);
export const getUserProfile    = ()     => axiosInstance.get('/user/profile/');
export const updateUserProfile = (data) => axiosInstance.put('/user/update-profile/', data);
export const changePassword    = (data) => axiosInstance.put('/user/change-password/', data);
export const userActivityLogs  = ()     => axiosInstance.get('/user/activity-logs/');

// ── Admin (/api/admin/) ───────────────────────────────────────────────────────
export const adminViewUsers     = ()     => axiosInstance.get('/admin/view-users/');
export const adminBlockUser     = (id)   => axiosInstance.put(`/admin/block-user/${id}/`);
export const adminResetPassword = (data) => axiosInstance.put('/admin/reset-user-password/', data);
export const adminActivityLogs  = ()     => axiosInstance.get('/admin/activity-logs/');

// ── Super Admin (/superadmin/) ────────────────────────────────────────────────
export const saLogin               = (data) => saApi.post('/login/', data);
export const saLogout              = (data) => saApi.post('/logout/', data);
export const saViewAdmins          = ()     => saApi.get('/view-admins/');
export const saCreateAdmin         = (data) => saApi.post('/create-admin/', data);
export const saUpdateAdmin         = (id, data) => saApi.put(`/update-admin/${id}/`, data);
export const saBlockAdmin          = (id)   => saApi.put(`/block-admin/${id}/`);
export const saDeleteAdmin         = (id)   => saApi.delete(`/delete-admin/${id}/`);
export const saViewUsers           = ()     => saApi.get('/view-users/');
export const saSystemLogs          = ()     => saApi.get('/system-logs/');
export const saForceChangePassword = (data) => saApi.post('/force-change-password/', data);

// ── AI Engine (/api/ai/) ──────────────────────────────────────────────────────
export const uploadFile       = (formData) => axiosInstance.post('/ai/upload/file/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getUploadPreview = () => axiosInstance.get('/ai/upload/preview/');
export const clearUpload      = () => axiosInstance.post('/ai/upload/clear/');
export const queryData        = (data) => axiosInstance.post('/ai/upload/query/', data);
