// Thin wrapper around fetch() that talks to the EduFlow backend server.
// Centralizing this means every api/* file just describes *which*
// endpoint to call, not how to call it.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const buildHeaders = (token, isFormData) => {
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiRequest = async (path, { method = 'GET', body, token, isFormData = false } = {}) => {
  const options = {
    method,
    headers: buildHeaders(token, isFormData)
  };

  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (err) {
    throw new Error('Unable to reach the EduFlow server. Please make sure the backend is running and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}.`);
  }

  return data;
};

export default apiRequest;
