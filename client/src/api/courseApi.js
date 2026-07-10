import { apiRequest } from './httpClient';

export const getCourses = async (filters = {}, token) => {
  const params = new URLSearchParams();
  if (filters.isPublished !== undefined) params.set('isPublished', filters.isPublished);
  if (filters.instructor !== undefined) params.set('instructor', filters.instructor);
  if (filters.category) params.set('category', filters.category);

  const query = params.toString() ? `?${params.toString()}` : '';
  
  return apiRequest(`/courses${query}`, { method: 'GET', token });
};

export const enroll = async (courseId, token) => {
  return apiRequest(`/courses/${courseId}/enroll`, { method: 'POST', token });
};

export const unenroll = async (courseId, token) => {
  return apiRequest(`/courses/${courseId}/unenroll`, { method: 'POST', token });
};

export const getCourseById = async (courseId, token) => {
  return apiRequest(`/courses/${courseId}`, { method: 'GET', token });
};

export const updateProgress = async (courseId, completedList, token) => {
  return apiRequest(`/courses/${courseId}/progress`, {
    method: 'PUT',
    token,
    body: { completedLessons: completedList }
  });
};

export const createCourse = async (formData, token) => {
  return apiRequest('/courses', {
    method: 'POST',
    token,
    body: formData,
    isFormData: true
  });
};

export const updateCourse = async (courseId, formData, token) => {
  return apiRequest(`/courses/${courseId}`, {
    method: 'PUT',
    token,
    body: formData,
    isFormData: true
  });
};

export const deleteCourse = async (courseId, token) => {
  return apiRequest(`/courses/${courseId}`, { method: 'DELETE', token });
};

export const uploadVideo = async (file, token) => {
  const formData = new FormData();
  formData.append('video', file);
  return apiRequest('/courses/upload/video', {
    method: 'POST',
    token,
    body: formData,
    isFormData: true
  });
};

export const setStudyGoal = async (courseId, goalData, token) => {
  return apiRequest(`/courses/${courseId}/goal`, {
    method: 'PUT',
    token,
    body: goalData
  });
};

export const toggleStudySession = async (courseId, date, token) => {
  return apiRequest(`/courses/${courseId}/goal/toggle`, {
    method: 'POST',
    token,
    body: { date }
  });
};

export const getCourseEnrollments = async (courseId, token) => {
  return apiRequest(`/courses/${courseId}/enrollments`, {
    method: 'GET',
    token
  });
};

