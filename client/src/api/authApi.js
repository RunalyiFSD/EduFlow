import { apiRequest } from './httpClient';

export const login = async (email, password) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
};

export const register = async (name, email, password, role) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password, role }
  });
};

export const resetPassword = async (token, password) => {
  return apiRequest(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: { password }
  });
};

// Sends the Google ID token to the backend for server-side verification.
// The backend verifies it with Google, then returns its own JWT.
// defaultRole is used only when creating a brand-new account via Google.
export const loginWithGoogle = async (credential, defaultRole = 'student') => {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: { credential, defaultRole }
  });
};

export const forgotPassword = async (email) => {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email }
  });
};

// Creates a new admin account; requires the admin secret key
export const registerAdmin = async (name, email, password, adminSecret) => {
  return apiRequest('/auth/register-admin', {
    method: 'POST',
    body: { name, email, password, adminSecret }
  });
};

// Google-based admin registration; also requires the admin secret key
export const googleAdminRegister = async (credential, adminSecret) => {
  return apiRequest('/auth/google-admin', {
    method: 'POST',
    body: { credential, adminSecret }
  });
};
