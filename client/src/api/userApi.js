import { apiRequest } from './httpClient';

export const getProfile = async (token) => {
  return apiRequest('/users/profile', { method: 'GET', token });
};

export const getNotifications = async (token) => {
  return apiRequest('/users/notifications', { method: 'GET', token });
};

export const markNotificationRead = async (id, token) => {
  return apiRequest(`/users/notifications/${id}/read`, { method: 'PUT', token });
};

export const getStats = async (token) => {
  return apiRequest('/users/stats', { method: 'GET', token });
};

export const getAdminTelemetry = async (token) => {
  return apiRequest('/users/admin/telemetry', { method: 'GET', token });
};

export const getAdminUsers = async (token) => {
  return apiRequest('/users/admin/users', { method: 'GET', token });
};

export const updateUserStatus = async (userId, updates, token) => {
  return apiRequest(`/users/admin/users/${userId}`, {
    method: 'PUT',
    token,
    body: updates
  });
};

export const getAdminAuditLogs = async (token) => {
  return apiRequest('/users/admin/audit-logs', { method: 'GET', token });
};

export const deleteAdminUser = async (userId, token) => {
  return apiRequest(`/users/admin/users/${userId}`, {
    method: 'DELETE',
    token
  });
};
