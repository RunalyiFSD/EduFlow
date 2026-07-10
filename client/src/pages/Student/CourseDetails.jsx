import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, updateProgress, enroll } from '../../api/courseApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader } from '../../components/Loader';
import {
  CheckCircle2, Play, FileText, ArrowLeft,
  BookOpen, Award, User, ChevronRight, LayoutDashboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './CourseDetails.css';

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

export const CourseDetails = () => {
  const { id: courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedList, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const data = await getCourseById(courseId, token);
      setCourse(data.course);
      setEnrollment(data.enrollment);
      setCompleted(data.enrollment?.completedLessons || []);
      if (data.course.modules?.length) {
        setActiveLesson(data.course.modules[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && courseId) {
      fetchCourseData();
    }
  }, [token, courseId]);

  const handleToggleLesson = async (lessonId) => {
    if (!enrollment || saving) return;
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

  const handleEnroll = async () => {
    if (!courseId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await enroll(courseId, token);
      setSuccessMsg('Successfully enrolled in course!');
      await fetchCourseData(); // Refresh to switch to enrolled view
    } catch (err) {
      setError(err.message || 'Failed to enroll in course.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  if (!course) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Course not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/student')} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const progress = enrollment?.progressPercentage || 0;

  return (
    <div className="page-wrapper course-details-container">
      <div className="cd-header-row">
        <button className="cd-back-btn" onClick={() => navigate('/student')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {error && <div className="cd-error-alert">{error}</div>}
      {successMsg && <div className="cd-success-alert">{successMsg}</div>}

      <div className="cd-course-header">
        <h1 className="cd-course-title">{course.title}</h1>
        {isEnrolled ? (
          <div className="cd-progress-row">
            <div className="cd-progress-bar-outer">
              <div className="cd-progress-bar-inner" style={{ width: `${progress}%` }} />
            </div>
            <span className="cd-progress-text">{progress}% Complete</span>
          </div>
        ) : (
          <div className="cd-course-meta-pills">
            <span className="cd-meta-pill cd-category-pill">{course.category}</span>
            <span className="cd-meta-pill cd-level-pill">{course.level}</span>
            <span className="cd-meta-pill cd-price-pill">{course.price === 0 ? 'Free' : `₹${course.price}`}</span>
          </div>
        )}
      </div>

      <div className="cd-layout">
        {/* Main Content Area */}
        <div className="cd-main-area">
          {!isEnrolled ? (
            <div className="glass-card cd-overview-card">
              <img src={getCoverSrc(course.coverImageUrl)} alt={course.title} className="cd-overview-img" />
              <h2 className="cd-section-title">Course Overview</h2>
              <p className="cd-course-desc">{course.description}</p>
              
              <div className="cd-instructor-info">
                <User size={18} color="#94a3b8" />
                <span>Instructor: <strong>{course.instructor?.name || 'EduFlow Educator'}</strong></span>
              </div>
              
              <button 
                className="btn btn-primary cd-enroll-big-btn" 
                onClick={handleEnroll}
                disabled={saving}
              >
                {saving ? 'Enrolling...' : 'Enroll Now to Unlock Curriculum'}
              </button>
            </div>
          ) : (
            <div className="glass-card cd-player-card">
              {activeLesson ? (
                <div className="cd-lesson-body">
                  <div className="cd-lesson-meta">
                    {activeLesson.type === 'video' ? <Play size={20} color="#6366f1" /> : <FileText size={20} color="#10b981" />}
                    <h2 className="cd-lesson-title">{activeLesson.title}</h2>
                  </div>

                  <div className="cd-lesson-viewport">
                    {activeLesson.type === 'video' ? (
                      activeLesson.content ? (
                        <div className="cd-video-container">
                          {activeLesson.content.includes('youtube.com') || activeLesson.content.includes('youtu.be') ? (
                             <iframe 
                               width="100%" 
                               height="100%" 
                               src={activeLesson.content.replace('watch?v=', 'embed/')} 
                               title={activeLesson.title}
                               frameBorder="0" 
                               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                               allowFullScreen
                             ></iframe>
                          ) : (
                            <video 
                              controls 
                              width="100%" 
                              className="cd-video-player"
                              src={activeLesson.content}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      ) : (
                        <div className="cd-video-placeholder">
                          <Play size={48} color="rgba(255,255,255,0.2)" />
                          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Video URL not provided.</p>
                        </div>
                      )
                    ) : (
                      <div className="cd-document-viewport">
                        <p className="cd-doc-text">{activeLesson.content}</p>
                      </div>
                    )}
                  </div>

                  <div className="cd-actions-row">
                    <button
                      className="btn cd-check-btn"
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
                <div className="cd-no-lesson"><p>No modules configured for this course.</p></div>
              )}
            </div>
          )}
        </div>

        {/* Syllabus Sidebar */}
        <div className="glass-card cd-syllabus-area">
          <h3 className="cd-syllabus-title">Course Syllabus</h3>
          <div className="cd-lesson-list">
            {course.modules?.map((lesson, idx) => {
              const isActive = activeLesson?._id === lesson._id;
              const isDone = completedList.includes(lesson._id);
              
              return (
                <div
                  key={lesson._id}
                  className={`cd-lesson-item ${!isEnrolled ? 'cd-lesson-item-locked' : ''}`}
                  style={isEnrolled ? {
                    borderColor:     isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                    backgroundColor: isActive ? 'rgba(99,102,241,0.05)' : 'transparent'
                  } : {}}
                  onClick={() => isEnrolled && setActiveLesson(lesson)}
                >
                  <div className="cd-lesson-item-left">
                    {isEnrolled ? (
                      <button className="cd-check-indicator" onClick={(e) => { e.stopPropagation(); handleToggleLesson(lesson._id); }}>
                        <CheckCircle2 size={18} color={isDone ? '#10b981' : 'rgba(255,255,255,0.1)'} />
                      </button>
                    ) : (
                      <div className="cd-lock-indicator">
                        <CheckCircle2 size={18} color="rgba(255,255,255,0.1)" />
                      </div>
                    )}
                    <div className="cd-lesson-details">
                      <span className="cd-lesson-idx">Lesson {idx + 1}</span>
                      <span className="cd-lesson-item-name">{lesson.title}</span>
                    </div>
                  </div>
                  {lesson.type === 'video' ? <Play size={14} color="#94a3b8" /> : <FileText size={14} color="#94a3b8" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
