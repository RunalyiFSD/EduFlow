import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileSpreadsheet,
  PlusCircle,
  FolderLock,
  Activity,
  Award,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import "./Sidebar.css";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const getLinkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  const renderLinks = () => {
    switch (user.role) {
      case "admin":
        return (
          <>
            <NavLink
              to="/admin"
              end
              className={getLinkClass}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={getLinkClass}
            >
              <Users size={18} />
              <span>Manage Users</span>
            </NavLink>

            <NavLink
              to="/admin/courses"
              className={getLinkClass}
            >
              <BookOpen size={18} />
              <span>Manage Courses</span>
            </NavLink>

            <NavLink
              to="/admin/audit-logs"
              className={getLinkClass}
            >
              <FileSpreadsheet size={18} />
              <span>Audit Logs</span>
            </NavLink>
          </>
        );

      case "instructor":
        return (
          <>
            <NavLink
              to="/instructor"
              end
              className={getLinkClass}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/instructor/create-course"
              className={getLinkClass}
            >
              <PlusCircle size={18} />
              <span>Create Course</span>
            </NavLink>

            <NavLink
              to="/instructor/my-courses"
              className={getLinkClass}
            >
              <FolderLock size={18} />
              <span>My Courses</span>
            </NavLink>
          </>
        );

      case "student":
      default:
        return (
          <>
            <NavLink
              to="/student"
              end
              className={getLinkClass}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/student/enrolled-courses"
              className={getLinkClass}
            >
              <Award size={18} />
              <span>My Enrollments</span>
            </NavLink>

            <NavLink
              to="/student/progress"
              className={getLinkClass}
            >
              <Activity size={18} />
              <span>Learning Progress</span>
            </NavLink>
          </>
        );
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>

        <div className="sidebar-logo-area">
          <div className="sidebar-logo-icon">⚡</div>
          <h1 className="sidebar-logo-text">
            EduFlow
          </h1>
        </div>

        <div className="sidebar-role-tag">
          <span className="sidebar-role-text">
            {user.role} workspace
          </span>
        </div>

        <nav className="sidebar-nav-links">
          {renderLinks()}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-footer-text">
            EduFlow v1.0
          </span>
        </div>
      </aside>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;