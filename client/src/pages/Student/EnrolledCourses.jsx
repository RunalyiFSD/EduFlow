import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCourseById, updateProgress } from '../../api/courseApi.js';
import { getStats } from '../../api/userApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader } from '../../components/Loader';
import {
  CheckCircle2, Play, FileText, ArrowLeft,
  BookOpen, Award, Clock, Search, Filter,
  BarChart2, ChevronRight, Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './EnrolledCourses.css';

/* ─── Helper ──────────────────────────────────────────────────── */
const getCoverSrc = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
  if (url.startsWith('/uploads/')) {
    const base = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5000';
    return `${base}${url}`;
  }
  return url;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ════════════════════════════════════════════════════════════════
   ENROLLMENT LIST VIEW  (no ?id param)
═══════════════════════════════════════════════════════════════ */
const EnrollmentList = () => {
  const { token } = useAuth();
  const navigate   = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all'); // all | inprogress | completed

  useEffect(() => {
    if (!token) return;
    getStats(token)
      .then((res) => setEnrollments(res.stats?.activeEnrollments || []))
      .catch((err) => setError(err.message || 'Failed to load enrollments.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loader />;

  /* ── Derived stats ── */
  const total     = enrollments.length;
  const completed = enrollments.filter((e) => e.isCompleted).length;
  const inProgress= enrollments.filter((e) => !e.isCompleted && e.progressPercentage > 0).length;
  const notStarted= total - completed - inProgress;

  /* ── Filter + search ── */
  const visible = enrollments.filter((e) => {
    if (!e.course) return false;
    const matchSearch = e.course.title.toLowerCase().includes(search.toLowerCase()) ||
                        (e.course.category || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'completed')  return e.isCompleted;
    if (filter === 'inprogress') return !e.isCompleted && e.progressPercentage > 0;
    if (filter === 'notstarted') return e.progressPercentage === 0;
    return true;
  });

  const TABS = [
    { key: 'all',        label: 'All Courses',  count: total },
    { key: 'inprogress', label: 'In Progress',  count: inProgress },
    { key: 'completed',  label: 'Completed',    count: completed },
    { key: 'notstarted', label: 'Not Started',  count: notStarted },
  ];

  return (
    <div className="page-wrapper enrl-list-wrapper">

      {/* ── Page header ── */}
      <div className="enrl-page-header">
        <div>
          <h1 className="enrl-page-title">My Enrolled Courses</h1>
          <p className="enrl-page-sub">Track your progress and continue where you left off</p>
        </div>
        <button className="btn btn-secondary enrl-back-btn" onClick={() => navigate('/student')}>
          <ArrowLeft size={16} /> Dashboard
        </button>
      </div>

      {error && <div className="enrl-error-alert">{error}</div>}

      {/* ── Stats summary ── */}
      <div className="enrl-stats-row">
        <div className="glass-card enrl-stat-card">
          <div className="enrl-stat-icon enrl-stat-icon--indigo"><BookOpen size={20} /></div>
          <div>
            <p className="enrl-stat-val">{total}</p>
            <p className="enrl-stat-label">Total Enrolled</p>
          </div>
        </div>
        <div className="glass-card enrl-stat-card">
          <div className="enrl-stat-icon enrl-stat-icon--amber"><BarChart2 size={20} /></div>
          <div>
            <p className="enrl-stat-val">{inProgress}</p>
            <p className="enrl-stat-label">In Progress</p>
          </div>
        </div>
        <div className="glass-card enrl-stat-card">
          <div className="enrl-stat-icon enrl-stat-icon--emerald"><Award size={20} /></div>
          <div>
            <p className="enrl-stat-val">{completed}</p>
            <p className="enrl-stat-label">Completed</p>
          </div>
        </div>
        <div className="glass-card enrl-stat-card">
          <div className="enrl-stat-icon enrl-stat-icon--slate"><Clock size={20} /></div>
          <div>
            <p className="enrl-stat-val">{notStarted}</p>
            <p className="enrl-stat-label">Not Started</p>
          </div>
        </div>
      </div>

      {/* ── Search + filter tabs ── */}
      <div className="enrl-controls">
        <div className="enrl-search-box">
          <Search size={16} className="enrl-search-icon" />
          <input
            type="text"
            className="enrl-search-input"
            placeholder="Search your courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="enrl-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`enrl-tab${filter === t.key ? ' enrl-tab--active' : ''}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              <span className="enrl-tab-badge">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Course list ── */}
      {total === 0 ? (
        <div className="glass-card enrl-empty-state">
          <BookOpen size={40} color="#6366f1" />
          <h3>No courses enrolled yet</h3>
          <p>Head to the dashboard to browse and enroll in available courses.</p>
          <button className="btn btn-primary" onClick={() => navigate('/student')}>
            Explore Courses
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card enrl-empty-state">
          <Filter size={32} color="#64748b" />
          <h3>No matches found</h3>
          <p>Try a different search term or filter.</p>
        </div>
      ) : (
        <div className="enrl-course-list">
          {visible.map((enr) => {
            const c   = enr.course;
            const pct = enr.progressPercentage || 0;
            return (
              <div
                key={enr._id}
                className="glass-card enrl-course-row"
                onClick={() => navigate(`/student/enrolled-courses?id=${c._id}`)}
              >
                {/* Cover thumbnail */}
                <div className="enrl-row-cover">
                  <img src={getCoverSrc(c.coverImageUrl)} alt={c.title} />
                  {enr.isCompleted && (
                    <div className="enrl-cover-badge enrl-cover-badge--done">
                      <Award size={12} /> Done
                    </div>
                  )}
                  {!enr.isCompleted && pct > 0 && (
                    <div className="enrl-cover-badge enrl-cover-badge--prog">
                      <Play size={11} /> Active
                    </div>
                  )}
                </div>

                {/* Main info */}
                <div className="enrl-row-body">
                  <div className="enrl-row-top">
                    <span className="enrl-row-category">{c.category}</span>
                    <span className="enrl-row-level">{c.level}</span>
                  </div>

                  <h3 className="enrl-row-title">{c.title}</h3>
                  <p className="enrl-row-desc">
                    {(c.description || '').substring(0, 100)}{c.description?.length > 100 ? '…' : ''}
                  </p>

                  <div className="enrl-row-meta">
                    <span><BookOpen size={13} /> {c.modules?.length || 0} modules</span>
                    <span><Calendar size={13} /> Enrolled {fmtDate(enr.enrolledAt)}</span>
                    {enr.isCompleted && enr.completedAt && (
                      <span className="enrl-meta-completed">
                        <CheckCircle2 size={13} /> Completed {fmtDate(enr.completedAt)}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="enrl-row-progress">
                    <div className="enrl-row-prog-bar">
                      <div
                        className="enrl-row-prog-fill"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: enr.isCompleted ? '#10b981' : '#6366f1'
                        }}
                      />
                    </div>
                    <span className="enrl-row-prog-pct">{pct}%</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="enrl-row-cta">
                  <button className={`btn enrl-cta-btn${enr.isCompleted ? ' enrl-cta-btn--done' : ''}`}>
                    {enr.isCompleted ? 'Review' : pct > 0 ? 'Continue' : 'Start'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   COURSE PLAYER VIEW  (?id=<courseId> param present)
═══════════════════════════════════════════════════════════════ */
const CoursePlayer = ({ courseId }) => {
  const { token }  = useAuth();
  const navigate   = useNavigate();

  const [course, setCourse]           = useState(null);
  const [enrollment, setEnrollment]   = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedList, setCompleted] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (!token || !courseId) return;
    getCourseById(courseId, token)
      .then((data) => {
        setCourse(data.course);
        setEnrollment(data.enrollment);
        setCompleted(data.enrollment?.completedLessons || []);
        if (data.course.modules?.length) setActiveLesson(data.course.modules[0]);
      })
      .catch((err) => setError(err.message || 'Failed to load course.'))
      .finally(() => setLoading(false));
  }, [token, courseId]);

  const handleToggleLesson = async (lessonId) => {
    if (saving) return;
    setSaving(true);
    const updated = completedList.includes(lessonId)
      ? completedList.filter((id) => id !== lessonId)
      : [...completedList, lessonId];

    try {
      const res = await updateProgress(courseId, updated, token);
      setCompleted(updated);
      setEnrollment(res.enrollment);
      if (res.enrollment.progressPercentage === 100 && !enrollment.isCompleted) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err) {
      setError(err.message || 'Failed to update progress.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  if (!course) return (
    <div className="page-wrapper" style={{ textAlign: 'center' }}>
      <p style={{ color: '#94a3b8' }}>Course not found or you are not enrolled.</p>
      <button className="btn btn-primary" onClick={() => navigate('/student/enrolled-courses')} style={{ marginTop: '1rem' }}>
        My Courses
      </button>
    </div>
  );

  const progress = enrollment?.progressPercentage || 0;

  return (
    <div className="page-wrapper player-container">
      <button className="player-back-btn" onClick={() => navigate('/student/enrolled-courses')}>
        <ArrowLeft size={16} /> My Enrolled Courses
      </button>

      <div className="player-course-header">
        <h1 className="player-course-title">{course.title}</h1>
        <div className="player-progress-row">
          <div className="player-progress-bar-outer">
            <div className="player-progress-bar-inner" style={{ width: `${progress}%` }} />
          </div>
          <span className="player-progress-text">{progress}% Complete</span>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}

      <div className="player-layout">
        {/* Content */}
        <div className="glass-card player-content-area">
          {activeLesson ? (
            <div className="player-lesson-body">
              <div className="player-lesson-meta">
                {activeLesson.type === 'video'
                  ? <Play size={20} color="#6366f1" />
                  : <FileText size={20} color="#10b981" />}
                <h2 className="player-lesson-title">{activeLesson.title}</h2>
              </div>

              <div className="player-lesson-viewport">
                {activeLesson.type === 'video' ? (
                  <div className="player-video-placeholder">
                    <Play size={48} color="rgba(255,255,255,0.4)" />
                    <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
                      Simulated Media Player: {activeLesson.content}
                    </p>
                  </div>
                ) : (
                  <div className="player-document-viewport">
                    <p className="player-doc-text">{activeLesson.content}</p>
                  </div>
                )}
              </div>

              <div className="player-actions-row">
                <button
                  className="btn player-check-btn"
                  style={{
                    backgroundColor: completedList.includes(activeLesson._id) ? 'rgba(16,185,129,0.1)' : '#6366f1',
                    color:           completedList.includes(activeLesson._id) ? '#10b981' : '#fff',
                    border:          completedList.includes(activeLesson._id) ? '1px solid #10b981' : 'none'
                  }}
                  onClick={() => handleToggleLesson(activeLesson._id)}
                  disabled={saving}
                >
                  <CheckCircle2 size={18} />
                  <span>{completedList.includes(activeLesson._id) ? 'Completed' : 'Mark as Completed'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="player-no-lesson"><p>No modules configured for this course.</p></div>
          )}
        </div>

        {/* Syllabus */}
        <div className="glass-card player-syllabus-area">
          <h3 className="player-syllabus-title">Course Syllabus</h3>
          <div className="player-lesson-list">
            {course.modules?.map((lesson, idx) => (
              <div
                key={lesson._id}
                className="player-lesson-item"
                style={{
                  borderColor:     activeLesson?._id === lesson._id ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  backgroundColor: activeLesson?._id === lesson._id ? 'rgba(99,102,241,0.05)' : 'transparent'
                }}
                onClick={() => setActiveLesson(lesson)}
              >
                <div className="player-lesson-item-left">
                  <button className="player-check-indicator" onClick={(e) => { e.stopPropagation(); handleToggleLesson(lesson._id); }}>
                    <CheckCircle2 size={18} color={completedList.includes(lesson._id) ? '#10b981' : 'rgba(255,255,255,0.1)'} />
                  </button>
                  <div className="player-lesson-details">
                    <span className="player-lesson-idx">Lesson {idx + 1}</span>
                    <span className="player-lesson-item-name">{lesson.title}</span>
                  </div>
                </div>
                {lesson.type === 'video' ? <Play size={14} color="#94a3b8" /> : <FileText size={14} color="#94a3b8" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ROOT  — decides which view to render
═══════════════════════════════════════════════════════════════ */
export const EnrolledCourses = () => {
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('id');
  return courseId ? <CoursePlayer courseId={courseId} /> : <EnrollmentList />;
};

export default EnrolledCourses;
