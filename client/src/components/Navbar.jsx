import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  User as UserIcon,
  Check,
  AlertTriangle,
  Target,
  Menu,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  getNotifications,
  markNotificationRead,
  getStats,
} from "../api/userApi";
import { toggleStudySession } from "../api/courseApi";
import { ThemeToggle } from "./ThemeToggle";
import "./ThemeToggle.css";
import "./Navbar.css";

export const Navbar = ({ title, onToggleSidebar }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const data = await getStats(token);
      setStats(data.stats);
    } catch (err) {
      console.error("Error loading stats in Navbar:", err.message);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'student') {
      loadStats();
    }
  }, [token, user]);

  useEffect(() => {
    const handleUpdate = () => {
      if (token && user?.role === 'student') {
        loadStats();
      }
    };
    window.addEventListener('studyGoalUpdated', handleUpdate);
    return () => window.removeEventListener('studyGoalUpdated', handleUpdate);
  }, [token, user]);

  const activeEnrollments = stats?.activeEnrollments || [];
  const enrollmentWithGoal = activeEnrollments.find(e => e.studyGoal?.studyDays?.length > 0) || activeEnrollments[0];

  const handleToggleNavbarStudySession = async (e) => {
    e.stopPropagation();
    if (enrollmentWithGoal?.course?._id) {
      try {
        await toggleStudySession(enrollmentWithGoal.course._id, null, token);
        loadStats();
        window.dispatchEvent(new Event('studyGoalUpdated'));
      } catch (err) {
        console.error("Error toggling session in Navbar:", err.message);
      }
    }
  };

  const handleNavbarGoalClick = (e) => {
    e.stopPropagation();
    if (enrollmentWithGoal) {
      if (window.location.pathname !== '/student') {
        navigate('/student');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openGoalModal', { 
            detail: { 
              enrollment: enrollmentWithGoal, 
              course: enrollmentWithGoal.course 
            } 
          }));
        }, 150);
      } else {
        window.dispatchEvent(new CustomEvent('openGoalModal', { 
          detail: { 
            enrollment: enrollmentWithGoal, 
            course: enrollmentWithGoal.course 
          } 
        }));
      }
    }
  };

  const getSessionsThisWeekCount = (completedDates) => {
    if (!completedDates || !Array.isArray(completedDates)) return 0;
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return completedDates.filter((d) => {
      const dateObj = new Date(d);
      return dateObj >= monday && dateObj <= sunday;
    }).length;
  };

  const completedThisWeek = enrollmentWithGoal?.studyGoal?.completedDates
    ? getSessionsThisWeekCount(enrollmentWithGoal.studyGoal.completedDates)
    : 0;

  const dotColors = [
    "#60a5fa",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e3a8a",
  ];

  useEffect(() => {
    if (token) {
      loadNotifications();

      const interval = setInterval(
        loadNotifications,
        30000
      );

      return () => clearInterval(interval);
    }
  }, [token]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(token);
      setNotifications(data.notifications);
    } catch (err) {
      console.error(
        "Error fetching notifications:",
        err.message
      );
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();

    try {
      await markNotificationRead(id, token);
      loadNotifications();
    } catch (err) {
      console.error(err.message);
    }
  };

  const unreadCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="navbar-hamburger-btn" 
          onClick={onToggleSidebar} 
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <h2 className="navbar-page-title">
          {title || "Dashboard"}
        </h2>
      </div>

      <div className="navbar-right-menu">
        {/* Study Goal Tracker (Only for Students) */}
        {user?.role === 'student' && enrollmentWithGoal && (
          <div className="navbar-goal-section">
            <div className="navbar-goal-left" onClick={handleNavbarGoalClick}>
              <Target size={18} className="navbar-goal-icon" />
              <span className="navbar-goal-text">
                {enrollmentWithGoal?.studyGoal?.studyDays?.length 
                  ? `Goal: ${enrollmentWithGoal.studyGoal.studyDays.length}d/wk` 
                  : "Set Goal"}
              </span>
            </div>
            
            <div className="navbar-goal-dots">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const weeklyProgress = enrollmentWithGoal?.studyGoal?.weeklyProgress || ['pending', 'pending', 'pending', 'pending', 'pending', 'pending'];
                const currentDayIndex = enrollmentWithGoal?.studyGoal?.currentDayIndex !== undefined ? enrollmentWithGoal.studyGoal.currentDayIndex : -1;
                
                const status = weeklyProgress[i] || 'pending';
                const isActive = i === currentDayIndex;
                const tooltip = enrollmentWithGoal?.studyGoal?.studyDays?.length
                  ? `${DAYS_FULL[i]}: ${status.charAt(0).toUpperCase() + status.slice(1)}${isActive ? ' (Today)' : ''} ${status === 'completed' ? '✅' : status === 'missed' ? '❌' : '⏳'} (Click to toggle today's session)`
                  : "Set a goal to start tracking!";
                
                return (
                  <button
                    key={i}
                    className={`navbar-goal-dot status-${status} ${isActive ? 'active' : ''}`}
                    title={tooltip}
                    onClick={handleToggleNavbarStudySession}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="navbar-notification-wrapper">
          <button
            className="navbar-icon-btn"
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
          >
            <Bell size={20} color="#94a3b8" />

            {unreadCount > 0 && (
              <span className="navbar-badge">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="navbar-dropdown">
              <h4 className="navbar-dropdown-header">
                Notifications
              </h4>

              <div className="navbar-notifications-list">
                {notifications.length === 0 ? (
                  <p className="navbar-empty-text">
                    No alerts yet.
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`navbar-notification-item ${
                        !notif.isRead ? "unread" : ""
                      }`}
                    >
                      <div>
                        <h5 className="navbar-notif-title">
                          {notif.title}
                        </h5>

                        <p className="navbar-notif-msg">
                          {notif.message}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <button
                          className="navbar-mark-read-btn"
                          onClick={(e) =>
                            handleMarkRead(
                              notif._id,
                              e
                            )
                          }
                          title="Mark as Read"
                        >
                          <Check
                            size={14}
                            color="#10b981"
                          />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="navbar-profile-tag">
          <div className="navbar-avatar">
            <UserIcon
              size={16}
              color="#6366f1"
            />
          </div>

          <div className="navbar-user-info">
            <span className="navbar-user-name">
              {user?.name}
            </span>

            <span className="navbar-user-role">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Theme Color Switcher */}
        <ThemeToggle />

        {/* Logout */}
        <button
          className="navbar-logout-btn"
          onClick={handleLogoutClick}
          title="Sign Out"
        >
          <LogOut size={20} color="#ef4444" />
        </button>
      </div>

      {/* Logout Confirmation Popup - rendered via portal so it always sits above all other content */}
      {showLogoutConfirm && createPortal(
        <div
          className="logout-modal-overlay"
          onClick={handleCancelLogout}
        >
          <div
            className="glass-card logout-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-icon">
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <h3 className="logout-modal-header">
              Log Out of EduFlow?
            </h3>
            <p className="logout-modal-text">
              Are you sure you want to log out, {user?.name || "there"}?
              You'll need to sign in again to access your {user?.role} portal.
            </p>
            <div className="logout-modal-btns">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmLogout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;