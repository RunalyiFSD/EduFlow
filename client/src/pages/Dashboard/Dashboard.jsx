import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStats, getAdminTelemetry, getNotifications, markNotificationRead } from '../../api/userApi';
import { getCourses, enroll, unenroll, setStudyGoal, toggleStudySession } from '../../api/courseApi';
import { Loader } from '../../components/Loader';
import { CourseCard } from '../../components/CourseCard';
import {
  BookOpen,
  Award,
  Users,
  PlusCircle,
  Clock,
  Target,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  CheckCircle2,
  Trophy,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import './Dashboard.css';

const getNextReminderString = (studyGoal) => {
  if (!studyGoal || !studyGoal.studyDays?.length || !studyGoal.studyTime) {
    return 'No reminders set';
  }
  const daysStr = studyGoal.studyDays.map(d => d.slice(0, 3)).join(', ');
  const [h, m] = studyGoal.studyTime.split(':');
  const hrs = parseInt(h);
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  const displayHrs = hrs % 12 || 12;
  return `${daysStr} at ${displayHrs}:${m} ${ampm}`;
};

const getTodayStatusString = (studyGoal) => {
  if (!studyGoal || studyGoal.currentDayIndex === undefined) return 'Rest Day 😌';
  const currentDayIndex = studyGoal.currentDayIndex;
  if (currentDayIndex === -1) return 'Rest Day 😌';
  const weeklyProgress = studyGoal.weeklyProgress || [];
  const status = weeklyProgress[currentDayIndex];
  if (status === 'completed') return 'Completed ✅';
  if (status === 'missed') return 'Missed ❌';
  return 'Pending ⏳';
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpaySimulatorModal = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState('card');
  const [selectedBank, setSelectedBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('card');
      setSelectedBank('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setUpiId('');
      setPaying(false);
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const upiUri = `upi://pay?pa=eduflow@upi&pn=EduFlow%20Portal&am=${data.amount}&cu=INR&tn=${encodeURIComponent(data.description)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      data.handler({
        razorpay_payment_id: `pay_sim_${Math.random().toString(36).substr(2, 9)}`
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="razorpay-sim-overlay" onClick={onClose}>
      <div className="razorpay-sim-container" onClick={(e) => e.stopPropagation()}>
        <div className="razorpay-sim-test-ribbon">Test Mode</div>
        
        <div className="razorpay-sim-header">
          <div className="razorpay-sim-header-left">
            <span className="razorpay-sim-merchant">{data.name}</span>
            <span className="razorpay-sim-desc">{data.description}</span>
          </div>
          <div className="razorpay-sim-amount">₹{data.amount}</div>
          <button type="button" className="razorpay-sim-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="razorpay-sim-body">
          <div className="razorpay-sim-tabs">
            <button
              type="button"
              className={`razorpay-sim-tab ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => setActiveTab('card')}
            >
              Card
            </button>
            <button
              type="button"
              className={`razorpay-sim-tab ${activeTab === 'upi' ? 'active' : ''}`}
              onClick={() => setActiveTab('upi')}
            >
              UPI
            </button>
            <button
              type="button"
              className={`razorpay-sim-tab ${activeTab === 'netbanking' ? 'active' : ''}`}
              onClick={() => setActiveTab('netbanking')}
            >
              Netbanking
            </button>
          </div>

          <div className="razorpay-sim-content">
            {activeTab === 'card' && (
              <div>
                <div className="razorpay-sim-input-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="4111 1111 1111 1111"
                    className="razorpay-sim-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    disabled={paying}
                  />
                </div>
                <div className="razorpay-sim-row">
                  <div className="razorpay-sim-input-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="razorpay-sim-input"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      disabled={paying}
                    />
                  </div>
                  <div className="razorpay-sim-input-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength="3"
                      className="razorpay-sim-input"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      disabled={paying}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                  <img 
                    src={qrUrl} 
                    alt="UPI QR Code" 
                    style={{ width: '110px', height: '110px', display: 'block' }}
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 29 29"><path fill="%23000" d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0zm9 0h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm5-22h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm5-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm-5 5h2v2h-2zm3 0h2v2h-2zm2 2h2v2h-2zm-5 2h2v2h-2zm3 0h2v2h-2zm2 2h2v2h-2zm-8-5h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9z"/><path fill="%23000" d="M1 1h5v5H1zm22 0h5v5h-5zM1 23h5v5H1zm8-13h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm5-6h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm5-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm-5 5h2v2h-2zm3 0h2v2h-2zm2 2h2v2h-2zm-5 2h2v2h-2zm3 0h2v2h-2zm2 2h2v2h-2zm-8-5h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9z"/></svg>';
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.725rem', color: '#718096', textAlign: 'center', lineHeight: '1.3' }}>
                  Scan code with any UPI app, or enter your UPI ID below:
                </span>
                <div className="razorpay-sim-input-group" style={{ width: '100%', marginBottom: 0 }}>
                  <label>UPI ID</label>
                  <input
                    type="text"
                    placeholder="username@upi"
                    className="razorpay-sim-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={paying}
                  />
                </div>
              </div>
            )}

            {activeTab === 'netbanking' && (
              <div className="razorpay-sim-banks">
                {['SBI', 'HDFC', 'ICICI', 'Axis'].map((bank) => (
                  <button
                    type="button"
                    key={bank}
                    className={`razorpay-sim-bank-btn ${selectedBank === bank ? 'selected' : ''}`}
                    onClick={() => setSelectedBank(bank)}
                    disabled={paying}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="razorpay-sim-pay-btn"
            disabled={paying}
            onClick={handlePay}
          >
            {paying ? 'Processing Payment...' : `Pay ₹${data.amount}`}
          </button>
        </div>

        <div className="razorpay-sim-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#718096" style={{ marginRight: '4px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          Secured by Razorpay
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Unified Loading/Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student portal states
  const [studentStats, setStudentStats] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollingCourse, setEnrollingCourse] = useState(false);
  const [showRazorpaySimulator, setShowRazorpaySimulator] = useState(false);
  const [simulatorData, setSimulatorData] = useState(null);

  // Instructor portal states
  const [instructorStats, setInstructorStats] = useState(null);
  const [authoredCourses, setAuthoredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Admin portal states
  const [adminTelemetry, setAdminTelemetry] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      if (user.role === 'student') {
        const statsRes = await getStats(token);
        setStudentStats(statsRes.stats);

        const coursesRes = await getCourses({ isPublished: true }, token);
        const enrolledIds = new Set(statsRes.stats.activeEnrollments.map(e => String(e.course._id)));
        const unEnrolled = coursesRes.courses.filter(c => !enrolledIds.has(String(c._id)));
        setAvailableCourses(unEnrolled);
      } else if (user.role === 'instructor') {
        const statsRes = await getStats(token);
        setInstructorStats(statsRes.stats);

        const coursesRes = await getCourses({ instructor: user.id }, token);
        setAuthoredCourses(coursesRes.courses);

        const notifRes = await getNotifications(token);
        setNotifications(notifRes.notifications || []);
      } else if (user.role === 'admin') {
        const teleRes = await getAdminTelemetry(token);
        setAdminTelemetry(teleRes.telemetry);
      }
    } catch (err) {
      setError(err.message || 'Failed to populate dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      loadDashboard();
    }
  }, [token, user?.role]);

  // Listeners for navbar goal clicks
  useEffect(() => {
    const handleOpenGoal = (e) => {
      const { enrollment, course } = e.detail || {};
      setSelectedEnrollment(enrollment);
      setSelectedCourse(course);
      setShowGoalModal(true);
      setShowProgressModal(false);
    };

    const handleOpenProgress = (e) => {
      const { enrollment, course } = e.detail || {};
      setSelectedEnrollment(enrollment);
      setSelectedCourse(course);
      setShowProgressModal(true);
      setShowGoalModal(false);
    };

    window.addEventListener('openGoalModal', handleOpenGoal);
    window.addEventListener('openDailyProgressModal', handleOpenProgress);

    return () => {
      window.removeEventListener('openGoalModal', handleOpenGoal);
      window.removeEventListener('openDailyProgressModal', handleOpenProgress);
    };
  }, []);

  // Listen to general goal updates to reload stats
  useEffect(() => {
    const handleUpdate = () => {
      if (token) {
        getStats(token)
          .then(res => {
            if (user.role === 'student') setStudentStats(res.stats);
            if (user.role === 'instructor') setInstructorStats(res.stats);
          })
          .catch(err => console.error('Failed to reload telemetry stats:', err));
      }
    };
    window.addEventListener('studyGoalUpdated', handleUpdate);
    return () => window.removeEventListener('studyGoalUpdated', handleUpdate);
  }, [token]);

  // Student action: Enroll
  const handleEnroll = async (courseId) => {
    setError('');
    setSuccessMsg('');
    const courseObj = availableCourses.find(c => String(c._id) === String(courseId));
    if (courseObj && courseObj.price > 0) {
      setEnrollingCourse(true);
      try {
        const key = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_5xX1bU9u5X1bU9';
        
        let loaded = false;
        if (key !== 'rzp_test_5xX1bU9u5X1bU9') {
          loaded = await loadRazorpayScript();
        }

        const handleSuccess = async (response) => {
          try {
            setEnrollingCourse(true);
            await enroll(courseObj._id, token);
            setSuccessMsg(`Successfully paid ₹${courseObj.price} via Razorpay and enrolled in "${courseObj.title}"! Payment ID: ${response.razorpay_payment_id}`);
            await loadDashboard();
          } catch (err) {
            setError(err.message || 'Failed to complete enrollment after payment verification.');
          } finally {
            setEnrollingCourse(false);
          }
        };

        if (key === 'rzp_test_5xX1bU9u5X1bU9' || !loaded) {
          // Trigger the beautiful Razorpay Simulator Modal
          setSimulatorData({
            amount: courseObj.price,
            name: 'EduFlow Portal',
            description: `Enrollment for ${courseObj.title}`,
            handler: handleSuccess
          });
          setShowRazorpaySimulator(true);
          setEnrollingCourse(false);
        } else {
          // Trigger actual Razorpay SDK
          const options = {
            key,
            amount: courseObj.price * 100,
            currency: 'INR',
            name: 'EduFlow Portal',
            description: `Enrollment for ${courseObj.title}`,
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80',
            handler: handleSuccess,
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone || '9999999999'
            },
            theme: {
              color: '#6366f1'
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          setEnrollingCourse(false);
        }
      } catch (err) {
        setError(err.message || 'Error opening Razorpay payment interface.');
        setEnrollingCourse(false);
      }
    } else {
      try {
        await enroll(courseId, token);
        setSuccessMsg('Successfully enrolled in course! Go to your active learning view.');
        await loadDashboard();
      } catch (err) {
        setError(err.message || 'Failed to enroll in course.');
      }
    }
  };

  // Student action: Open Goal Modal
  const handleOpenGoalModal = (e, enr) => {
    e.stopPropagation();
    setSelectedEnrollment(enr);
    setSelectedCourse(enr.course);
    setShowGoalModal(true);
  };

  // Student action: Open Daily Progress
  const handleOpenDailyProgress = (e, enr) => {
    e.stopPropagation();
    setSelectedEnrollment(enr);
    setSelectedCourse(enr.course);
    setShowProgressModal(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="page-wrapper">
      {error && <div className="dashboard-error-alert">{error}</div>}
      {successMsg && <div className="dashboard-success-alert">{successMsg}</div>}

      {/* ── STUDENT VIEW ────────────────────────────────────────────── */}
      {user.role === 'student' && (
        <div className="student-dashboard">
          <div className="dashboard-view-header">
            <div>
              <h1 className="dashboard-view-title">Student Dashboard</h1>
              <p className="dashboard-view-sub">Track your education, study milestones, and enroll in new paths.</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/student/enrolled-courses')}
            >
              <BookOpen size={16} /> My Playback Player
            </button>
          </div>

          {/* Metrics Row */}
          <div className="stat-grid">
            <div className="glass-card dashboard-stat-card">
              <BookOpen size={24} color="#6366f1" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{studentStats?.enrolledCoursesCount || 0}</h4>
                <span className="dashboard-stat-label">Enrolled Courses</span>
              </div>
            </div>

            <div className="glass-card dashboard-stat-card">
              <Award size={24} color="#10b981" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{studentStats?.completedCoursesCount || 0}</h4>
                <span className="dashboard-stat-label">Completed / Certified</span>
              </div>
            </div>
          </div>

          {/* Active Enrolled Courses */}
          <div className="dashboard-view-section">
            <h2 className="dashboard-sec-title">My Active Courses</h2>
            {studentStats?.activeEnrollments.length === 0 ? (
              <div className="glass-card dashboard-empty-card">
                <p>You haven't enrolled in any courses yet. Browse the catalog below to start learning!</p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {studentStats?.activeEnrollments
                  .filter(enr => enr.course && enr.course._id)
                  .map(enr => {
                    const hasGoal = enr.studyGoal?.studyDays?.length > 0;
                    return (
                      <div key={enr._id} className="student-course-item-wrapper">
                        <CourseCard
                          course={{ ...enr.course, _id: String(enr.course._id) }}
                          enrollment={enr}
                          onClick={() => navigate(`/student/course/${enr.course._id}`)}
                        />
                        <div className="dashboard-course-goal-controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {hasGoal ? (
                            <button
                              className="btn btn-secondary dashboard-goal-action-btn goal-configured"
                              onClick={(e) => handleOpenDailyProgress(e, enr)}
                            >
                              <Target size={14} color="#10b981" />
                              <span>Daily Progress Tracker</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary dashboard-goal-action-btn"
                              onClick={(e) => handleOpenGoalModal(e, enr)}
                            >
                              <Target size={14} />
                              <span>Set Study Goal</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger dashboard-goal-action-btn btn-unenroll"
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#ef4444',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to unenroll from "${enr.course.title}"? This will delete all study goals and progress history.`)) {
                                try {
                                  setLoading(true);
                                  await unenroll(enr.course._id, token);
                                  setSuccessMsg(`Successfully unenrolled from "${enr.course.title}".`);
                                  await loadDashboard();
                                } catch (err) {
                                  setError(err.message || 'Failed to unenroll.');
                                  setLoading(false);
                                }
                              }
                            }}
                          >
                            Unenroll from Course
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>

          {/* Available Catalog */}
          <div className="dashboard-view-section">
            <h2 className="dashboard-sec-title">Explore New Courses</h2>
            {availableCourses.length === 0 ? (
              <div className="glass-card dashboard-empty-card">
                <p>No new courses currently available for enrollment. Check back later!</p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {availableCourses.map(course => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    onEnroll={handleEnroll}
                    onClick={() => navigate(`/student/course/${course._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INSTRUCTOR VIEW ─────────────────────────────────────────── */}
      {user.role === 'instructor' && (
        <div className="instructor-dashboard">
          <div className="dashboard-view-header">
            <div>
              <h1 className="dashboard-view-title">Instructor Panel</h1>
              <p className="dashboard-view-sub">Author your syllabus, manage curricula, and monitor student metrics.</p>
            </div>
            <Link to="/instructor/create-course" className="btn btn-primary">
              <PlusCircle size={18} />
              <span>Author New Course</span>
            </Link>
          </div>

          {!user.isApproved && (
            <div className="dashboard-approval-warning">
              <strong>⚠️ Profile Pending Approval:</strong> Your instructor profile is currently awaiting review. You cannot publish courses until approved by an administrator.
            </div>
          )}

          {/* Metrics Row */}
          <div className="stat-grid">
            <div className="glass-card dashboard-stat-card">
              <BookOpen size={24} color="#6366f1" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{instructorStats?.myCoursesCount || 0}</h4>
                <span className="dashboard-stat-label">Courses Created</span>
              </div>
            </div>

            <div className="glass-card dashboard-stat-card">
              <Users size={24} color="#10b981" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{instructorStats?.totalStudentsEnrolled || 0}</h4>
                <span className="dashboard-stat-label">Active Enrollments</span>
              </div>
            </div>

            <div className="glass-card dashboard-stat-card">
              <Award size={24} color="#f59e0b" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{instructorStats?.completionsCount || 0}</h4>
                <span className="dashboard-stat-label">Completed Pathways</span>
              </div>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="dashboard-view-section notifications-section">
            <h2 className="dashboard-sec-title">Recent Notifications</h2>
            {notifications.length === 0 ? (
              <div className="glass-card dashboard-empty-card" style={{ padding: '2rem' }}>
                <p>No new notifications at this time. When students enroll in your courses, you'll see alerts here.</p>
              </div>
            ) : (
              <div className="dashboard-notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map((notif) => (
                  <div 
                    key={notif._id} 
                    className={`glass-card notification-item ${notif.isRead ? 'read' : 'unread'}`}
                    style={{
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: notif.isRead ? 'rgba(255, 255, 255, 0.01)' : 'rgba(99, 102, 241, 0.05)',
                      borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>📢</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: notif.isRead ? '500' : '600' }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!notif.isRead && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={async () => {
                          try {
                            await markNotificationRead(notif._id, token);
                            setNotifications(prev =>
                              prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
                            );
                          } catch (err) {
                            console.error('Failed to mark notification as read:', err);
                          }
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Owned Curricula List */}
          <div className="dashboard-view-section">
            <h2 className="dashboard-sec-title">My Authored Curricula</h2>
            {authoredCourses.length === 0 ? (
              <div className="glass-card dashboard-empty-card">
                <p>You haven't authored any courses yet. Start by clicking the author button above!</p>
              </div>
            ) : (
              <div className="dashboard-list-container">
                {authoredCourses.map(course => (
                  <div key={course._id} className="glass-card dashboard-course-item">
                    <div className="dashboard-course-item-left">
                      <img
                        src={course.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                        alt=""
                        className="dashboard-thumbnail"
                      />
                      <div>
                        <h4 className="dashboard-course-title-text">{course.title}</h4>
                        <p className="dashboard-course-meta">
                          Category: {course.category} | Level: {course.level} | Modules: {course.modules?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="dashboard-course-item-right">
                      <span
                        className="dashboard-status-badge"
                        style={{
                          backgroundColor: course.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: course.isPublished ? '#10b981' : '#f59e0b'
                        }}
                      >
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <Link to="/instructor/my-courses" className="btn btn-secondary">
                        Manage Catalog
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN VIEW ──────────────────────────────────────────────── */}
      {user.role === 'admin' && (
        <div className="admin-dashboard">
          <div className="dashboard-view-header">
            <div>
              <h1 className="dashboard-view-title">System Analytics Telemetry</h1>
              <p className="dashboard-view-sub">Administrative telemetry summary logs, platform registrations, and financials.</p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="stat-grid">
            <div className="glass-card dashboard-stat-card">
              <Users size={24} color="#6366f1" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{adminTelemetry?.totalUsers || 0}</h4>
                <span className="dashboard-stat-label">Total Registrants</span>
              </div>
            </div>

            <div className="glass-card dashboard-stat-card">
              <DollarSign size={24} color="#10b981" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">₹{adminTelemetry?.totalRevenue || 0}</h4>
                <span className="dashboard-stat-label">Platform Revenue</span>
              </div>
            </div>

            <div className="glass-card dashboard-stat-card">
              <BookOpen size={24} color="#f59e0b" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{adminTelemetry?.coursesCount || 0}</h4>
                <span className="dashboard-stat-label">Authored Courses</span>
              </div>
            </div>

            <div className="glass-card dashboard-stat-card">
              <Award size={24} color="#ec4899" />
              <div className="dashboard-stat-info">
                <h4 className="dashboard-stat-val">{adminTelemetry?.enrollmentsCount || 0}</h4>
                <span className="dashboard-stat-label">Active Enrollments</span>
              </div>
            </div>
          </div>

          {/* System Breakdown Panels */}
          <div className="admin-breakdown-row">
            <div className="glass-card admin-breakdown-card">
              <h3 className="admin-breakdown-title">Users Breakdown</h3>
              <div className="admin-breakdown-item">
                <span>Students / Learners</span>
                <strong>{adminTelemetry?.studentsCount || 0}</strong>
              </div>
              <div className="admin-breakdown-item">
                <span>Instructors / Educators</span>
                <strong>{adminTelemetry?.instructorsCount || 0}</strong>
              </div>
              <div className="admin-breakdown-item">
                <span>System Administrators</span>
                <strong>
                  {Math.max(
                    1,
                    (adminTelemetry?.totalUsers || 0) -
                    (adminTelemetry?.studentsCount || 0) -
                    (adminTelemetry?.instructorsCount || 0)
                  )}
                </strong>
              </div>
            </div>

            <div className="glass-card admin-breakdown-card">
              <h3 className="admin-breakdown-title">Platform Integrity</h3>
              <div className="admin-health-status">
                <div className="admin-pulse-dot"></div>
                <div>
                  <h4 className="admin-health-title">All Systems Operational</h4>
                  <p className="admin-health-text">
                    node-cron active summaries running every Monday morning at 9:00 AM. Cloudinary uploads functional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────── */}
      {/* 1. SET A GOAL MODAL */}
      <StudyGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        enrollment={selectedEnrollment}
        course={selectedCourse}
        token={token}
        onGoalSaved={loadDashboard}
      />

      {/* 2. DAILY PROGRESS MODAL */}
      <DailyProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        enrollment={selectedEnrollment}
        course={selectedCourse}
        token={token}
        onGoalSaved={loadDashboard}
        onOpenModifyGoal={() => {
          setShowProgressModal(false);
          setShowGoalModal(true);
        }}
      />
      {/* 3. RAZORPAY SIMULATOR MODAL */}
      <RazorpaySimulatorModal
        isOpen={showRazorpaySimulator}
        onClose={() => setShowRazorpaySimulator(false)}
        data={simulatorData}
      />
    </div>
  );
};

// ── STUDY GOAL SETTING MODAL ─────────────────────────────────────────
const StudyGoalModal = ({ isOpen, onClose, enrollment, course, token, onGoalSaved }) => {
  const [studyDays, setStudyDays] = useState([]);
  const [studyTime, setStudyTime] = useState('12:00');
  const [duration, setDuration] = useState('30 min');
  const [receiveWhatsapp, setReceiveWhatsapp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (enrollment?.studyGoal) {
      setStudyDays(enrollment.studyGoal.studyDays || []);
      setStudyTime(enrollment.studyGoal.studyTime || '12:00');
      setDuration(enrollment.studyGoal.duration || '30 min');
      setReceiveWhatsapp(!!enrollment.studyGoal.receiveWhatsapp);
    } else {
      setStudyDays([]);
      setStudyTime('12:00');
      setDuration('30 min');
      setReceiveWhatsapp(false);
    }
    setError('');
  }, [enrollment, isOpen]);

  if (!isOpen) return null;

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DURATIONS = ['15 min', '30 min', '1 hr', '2 hr', '3 hr'];

  const handleToggleDay = (day) => {
    if (studyDays.includes(day)) {
      setStudyDays(studyDays.filter(d => d !== day));
    } else {
      setStudyDays([...studyDays, day]);
    }
  };

  const handleMarkAllDays = (e) => {
    if (e.target.checked) {
      setStudyDays(DAYS);
    } else {
      setStudyDays([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studyDays.length) {
      setError('Please select at least one study day.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setStudyGoal(course._id, {
        studyDays,
        studyTime,
        duration,
        receiveWhatsapp
      }, token);
      
      window.dispatchEvent(new Event('studyGoalUpdated'));
      onGoalSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save study goal.');
    } finally {
      setSaving(false);
    }
  };

  // Estimate weeks calculation
  const totalModules = course?.modules?.length || 0;
  let modulesPerSession = 0.5;
  if (duration === '15 min') modulesPerSession = 0.25;
  else if (duration === '30 min') modulesPerSession = 0.5;
  else if (duration === '1 hr') modulesPerSession = 1.0;
  else if (duration === '2 hr') modulesPerSession = 2.0;
  else if (duration === '3 hr') modulesPerSession = 3.0;

  const sessionsNeeded = Math.ceil(totalModules / modulesPerSession);
  const weeklyFreq = studyDays.length;
  const weeksNeeded = weeklyFreq > 0 ? Math.ceil(sessionsNeeded / weeklyFreq) : 0;

  return (
    <div className="goal-modal-overlay" onClick={onClose}>
      <div className="goal-modal-container glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="goal-modal-header">
          <h2 className="goal-modal-title">Set a Goal</h2>
          <button type="button" className="goal-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-modal-form">
          {error && <div className="goal-modal-error">{error}</div>}

          {/* Reminder Card Header */}
          <div className="goal-reminder-box">
            <div className="goal-reminder-details">
              <span className="goal-reminder-badge">📅</span>
              <div>
                <h4 className="goal-reminder-title">Reminder: {course?.title}</h4>
                <p className="goal-reminder-sub">Course: {course?.title}</p>
              </div>
            </div>
            <div className="goal-reminder-thumbnail">
              <img
                src={course?.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                alt=""
              />
            </div>
          </div>

          <div className="goal-estimate-banner">
            {weeklyFreq > 0 ? (
              <p>Frequency: <strong>{weeklyFreq} days/week</strong> • Est. Completion: <strong>{weeksNeeded} weeks</strong> ({sessionsNeeded} sessions)</p>
            ) : (
              <p>Select a time, duration and frequency to view estimated time.</p>
            )}
          </div>

          {/* Days selection */}
          <div className="goal-form-section">
            <label className="goal-section-label">Mark the days when you want to study?</label>
            <div className="goal-days-grid">
              {DAYS.map(day => {
                const selected = studyDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    className={`goal-day-chip ${selected ? 'active' : ''}`}
                    onClick={() => handleToggleDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <label className="goal-checkbox-label goal-mark-all">
              <input
                type="checkbox"
                checked={studyDays.length === DAYS.length}
                onChange={handleMarkAllDays}
              />
              <span>Mark all days</span>
            </label>
          </div>

          {/* Time Picker */}
          <div className="goal-form-section">
            <label className="goal-section-label">When do you want to study?</label>
            <div className="goal-time-picker-wrapper">
              <Clock size={16} className="goal-time-icon" />
              <input
                type="time"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
                className="goal-time-input"
              />
            </div>
          </div>

          {/* Duration Chips */}
          <div className="goal-form-section">
            <label className="goal-section-label">For how long?</label>
            <div className="goal-durations-grid">
              {DURATIONS.map(dur => {
                const selected = duration === dur;
                return (
                  <button
                    type="button"
                    key={dur}
                    className={`goal-duration-chip ${selected ? 'active' : ''}`}
                    onClick={() => setDuration(dur)}
                  >
                    {dur}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Whatsapp Alert Checkbox */}
          <div className="goal-form-section">
            <label className="goal-checkbox-label">
              <input
                type="checkbox"
                checked={receiveWhatsapp}
                onChange={(e) => setReceiveWhatsapp(e.target.checked)}
              />
              <span>Receive reminder and updates via Whatsapp</span>
            </label>
          </div>

          {/* Actions */}
          <div className="goal-modal-actions">
            <button
              type="submit"
              className="btn btn-primary goal-submit-btn"
              disabled={saving}
            >
              {saving ? 'Saving goal...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── DAILY PROGRESS CHECKIN MODAL ─────────────────────────────────────
const DailyProgressModal = ({ isOpen, onClose, enrollment, course, token, onGoalSaved, onOpenModifyGoal }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0); // Show week offset: 0 is current week

  if (!isOpen || !enrollment) return null;

  // Generate 6-day carousel dates of the current week (Mon to Sat)
  const getWeekDates = (weekOffset = 0) => {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    // Start of week date
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + distanceToMonday + (weekOffset * 7));
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(carouselIndex);

  // Toggle study session check-in
  const handleToggleDateCheckin = async (dateObj) => {
    const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD local format
    setSaving(true);
    setError('');
    try {
      await toggleStudySession(course._id, dateStr, token);
      window.dispatchEvent(new Event('studyGoalUpdated'));
      onGoalSaved();
    } catch (err) {
      setError(err.message || 'Failed to toggle check-in.');
    } finally {
      setSaving(false);
    }
  };

  // Date formatted keys
  const completedDates = enrollment.studyGoal?.completedDates || [];
  const durationText = enrollment.studyGoal?.duration || '30 min';
  
  // Estimate target range (Enrollment date to 6 months later)
  const enrollDate = new Date(enrollment.enrolledAt || Date.now());
  const targetDate = new Date(enrollDate);
  targetDate.setMonth(enrollDate.getMonth() + 6);
  
  const formatDateRangeString = () => {
    const f1 = enrollDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const f2 = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return `${f1} - ${f2}`;
  };

  // Calculation metrics
  const todayStr = new Date().toLocaleDateString('en-CA');
  const totalCompletedCount = completedDates.length;
  
  // Total modules and modules done
  const completedLessonsCount = enrollment.completedLessons?.length || 0;
  const totalLessonsCount = course?.modules?.length || 0;

  // Duration in minutes
  const parseDurationMin = (dur) => {
    if (dur.includes('15')) return 15;
    if (dur.includes('30')) return 30;
    if (dur.includes('1 hr') || dur.includes('1')) return 60;
    if (dur.includes('2 hr') || dur.includes('2')) return 120;
    if (dur.includes('3 hr') || dur.includes('3')) return 180;
    return 30;
  };
  const durationMinutes = parseDurationMin(durationText);

  // Math metrics
  const avgGoalMin = durationMinutes;
  const timeElapsedMin = totalCompletedCount * durationMinutes;
  
  // Estimated remaining time to finish course
  const remainingLessons = Math.max(0, totalLessonsCount - completedLessonsCount);
  const timeLeftMin = remainingLessons * 15; // Assume 15m average module study duration if unchecked

  const formatHoursMinutes = (totalMin) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Days to go countdown
  const diffTime = targetDate - new Date();
  const daysToGo = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <div className="goal-modal-overlay" onClick={onClose}>
      <div className="daily-progress-modal glass-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="daily-progress-header">
          <div className="daily-progress-title-row">
            <span className="daily-progress-badge-icon">🎯</span>
            <h2 className="daily-progress-title">
              Daily Progress <span className="daily-date-range">{formatDateRangeString()}</span>
            </h2>
          </div>
          <button type="button" className="goal-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="goal-modal-error">{error}</div>}

        {/* Goal Target Banner */}
        <div className="daily-progress-banner">
          <span className="daily-progress-day-count">DAY 1 - {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
          <span className="daily-progress-days-left">
            <strong className="text-danger">{daysToGo} days to go!</strong> Complete this course to get certified!
          </span>
          <button type="button" className="btn-link-modify" onClick={onOpenModifyGoal}>
            Modify goal
          </button>
        </div>

        {/* Dates Carousel */}
        <div className="daily-carousel-wrapper">
          <button 
            type="button" 
            className="carousel-arrow-btn"
            onClick={() => setCarouselIndex(prev => prev - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="daily-carousel-cards-container">
            {weekDates.map((dateObj, idx) => {
              const dateStr = dateObj.toLocaleDateString('en-CA');
              const isChecked = completedDates.includes(dateStr);
              const isToday = dateStr === todayStr;
              
              let cardStatus = 'pending';
              if (isChecked) {
                cardStatus = 'completed';
              } else {
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);
                const cardDate = new Date(dateObj);
                cardDate.setHours(0, 0, 0, 0);
                if (cardDate < todayMidnight) {
                  cardStatus = 'missed';
                } else if (cardDate.getTime() === todayMidnight.getTime()) {
                  cardStatus = 'active';
                }
              }

              const dateNumLabel = dateObj.getDate(); // 29
              const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short' }); // "Jun"

              return (
                <button
                  type="button"
                  key={idx}
                  className={`daily-carousel-card status-${cardStatus} ${isToday ? 'today' : ''}`}
                  onClick={() => handleToggleDateCheckin(dateObj)}
                  disabled={saving}
                >
                  <span className="carousel-card-day">DAY {idx + 1}</span>
                  <span className="carousel-card-date">{dateNumLabel} {monthLabel}</span>
                  
                  <div className={`carousel-card-status-pill ${isChecked ? 'checked' : ''} status-${cardStatus}`}>
                    {isChecked ? `${durationText.replace(' min', 'm')}` : cardStatus === 'missed' ? 'Missed' : '-'}
                  </div>
                </button>
              );
            })}
          </div>

          <button 
            type="button" 
            className="carousel-arrow-btn"
            onClick={() => setCarouselIndex(prev => prev + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Metrics Row */}
        <div className="daily-metrics-grid">
          <div className="daily-metric-box">
            <span className="daily-metric-label">Average Goal Set</span>
            <span className="daily-metric-value">{avgGoalMin}m</span>
          </div>

          <div className="daily-metric-box">
            <span className="daily-metric-label">Current Average</span>
            <span className="daily-metric-value">
              {totalCompletedCount > 0 ? Math.round(timeElapsedMin / (totalCompletedCount || 1)) : 0}m
            </span>
          </div>

          <div className="daily-metric-box">
            <span className="daily-metric-label">Time elapsed</span>
            <span className="daily-metric-value">{formatHoursMinutes(timeElapsedMin)}</span>
          </div>

          <div className="daily-metric-box">
            <span className="daily-metric-label">Time left</span>
            <span className="daily-metric-value">{formatHoursMinutes(timeLeftMin)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
