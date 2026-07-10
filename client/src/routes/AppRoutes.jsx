import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

// Welcome / Landing Page
import { Landing } from '../pages/Landing/Landing';

// Auth Pages
import { Login } from '../pages/Auth/Login';
import { Register } from '../pages/Auth/Register';
import { ForgotPassword } from '../pages/Auth/ForgotPassword';
import { ResetPassword } from '../pages/Auth/ResetPassword';
import { AdminLogin } from '../pages/Auth/AdminLogin';
import { AdminRegister } from '../pages/Auth/AdminRegister';

// Unified Consolidated Dashboard
import { Dashboard } from '../pages/Dashboard/Dashboard';

// Student Pages
import { EnrolledCourses } from '../pages/Student/EnrolledCourses';
import { Progress } from '../pages/Student/Progress';
import { CourseDetails } from '../pages/Student/CourseDetails';

// Instructor Pages
import { CreateCourse } from '../pages/Instructor/CreateCourse';
import { MyCourses } from '../pages/Instructor/MyCourse';

// Admin Pages
import { Users } from '../pages/Admin/User';
import { Courses } from '../pages/Admin/Courses';
import { AuditLogs } from '../pages/Admin/AuditLogs';

import { useAuth } from '../hooks/useAuth';

// Layout wrapper for authenticated pages showing Navbar and Sidebar
const AuthenticatedLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar drawer automatically on navigation changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/student/enrolled-courses')) return 'Active Course Player';
    if (pathname.startsWith('/student/course/')) return 'Course Details';
    if (pathname.startsWith('/student/progress')) return 'Learning Progress Telemetry';
    if (pathname === '/student') return 'Student Portal Dashboard';
    if (pathname === '/instructor/create-course') return 'Course Authoring Portal';
    if (pathname === '/instructor/my-courses') return 'Manage Authored Curricula';
    if (pathname === '/instructor') return 'Instructor Portal Dashboard';
    if (pathname === '/admin/users') return 'System Users Access Control';
    if (pathname === '/admin/courses') return 'All Platform Courses Auditing';
    if (pathname === '/admin/audit-logs') return 'System Audit Logs Logger';
    if (pathname === '/admin') return 'Platform Admin Dashboard';
    return 'EduFlow Portal';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar 
          title={getPageTitle(location.pathname)} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  const { token, user } = useAuth();

  return (
    <Routes>
      {/* Welcome / Landing Page - first page shown when the app opens */}
      <Route 
        path="/" 
        element={<Landing />} 
      />

      {/* Publicly accessible authentication endpoints */}
      <Route 
        path="/login" 
        element={token && user ? <Navigate to={`/${user.role}`} replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={token && user ? <Navigate to={`/${user.role}`} replace /> : <Register />} 
      />
      <Route 
      path="/forgot-password" 
      element={token && user ? <Navigate to={`/${user.role}`} replace /> : <ForgotPassword />} 
      />
      <Route 
        path="/reset-password/:token" 
        element={token && user ? <Navigate to={`/${user.role}`} replace /> : <ResetPassword />} 
      />
      <Route
        path="/admin-login"
        element={token && user?.role === 'admin' ? <Navigate to="/admin" replace /> : <AdminLogin />}
      />
      <Route
        path="/admin-register"
        element={token && user?.role === 'admin' ? <Navigate to="/admin" replace /> : <AdminRegister />}
      />

      {/* Student Protected Portal Path */}
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AuthenticatedLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/course/:id" element={<CourseDetails />} />
                <Route path="/enrolled-courses" element={<EnrolledCourses />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
              </Routes>
            </AuthenticatedLayout>
          </ProtectedRoute>
        } 
      />

      {/* Instructor Protected Portal Path */}
      <Route 
        path="/instructor/*" 
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <AuthenticatedLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create-course" element={<CreateCourse />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="*" element={<Navigate to="/instructor" replace />} />
              </Routes>
            </AuthenticatedLayout>
          </ProtectedRoute>
        } 
      />

      {/* Admin Protected Portal Path */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuthenticatedLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AuthenticatedLayout>
          </ProtectedRoute>
        } 
      />

      {/* Baseline fallback redirection */}
      <Route 
        path="*" 
        element={
          token && user 
            ? <Navigate to={`/${user.role}`} replace /> 
            : <Navigate to="/" replace />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
