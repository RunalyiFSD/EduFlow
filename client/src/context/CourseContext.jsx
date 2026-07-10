import React, { createContext, useState } from 'react';
import * as courseApi from '../api/courseApi';

export const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = async (filters = {}, token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await courseApi.getCourses(filters, token);
      setCourses(response.courses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId, token) => {
    setError(null);
    try {
      const response = await courseApi.enroll(courseId, token);
      // Refresh courses listing to update enrollment status details if needed
      return response.enrollment;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <CourseContext.Provider value={{
      courses,
      loading,
      error,
      fetchCourses,
      enrollInCourse
    }}>
      {children}
    </CourseContext.Provider>
  );
};
