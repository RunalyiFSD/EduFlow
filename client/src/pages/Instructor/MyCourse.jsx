import React, { useState, useEffect } from 'react';
import { getCourses, updateCourse, deleteCourse, getCourseEnrollments } from '../../api/courseApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader } from '../../components/Loader';
import { Edit3, Trash2, Globe, Lock, Users, X } from 'lucide-react';
import './MyCourse.css'; // Importing decoupled style overrides

export const MyCourses = () => {
  const { token, user } = useAuth();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Course Editing Modal state
  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  // Enrollments Modal state
  const [showEnrollmentsCourse, setShowEnrollmentsCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState('');

  const handleViewEnrollments = async (course) => {
    setShowEnrollmentsCourse(course);
    setLoadingEnrollments(true);
    setEnrollmentsError('');
    setEnrollments([]);
    try {
      const data = await getCourseEnrollments(course._id, token);
      setEnrollments(data.enrollments);
    } catch (err) {
      setEnrollmentsError(err.message || 'Failed to fetch enrolled students progress.');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCourses();
    }
  }, [token]);

  const loadCourses = async () => {
    try {
      const data = await getCourses({ instructor: user.id }, token);
      setCourses(data.courses);
    } catch (err) {
      setError(err.message || 'Failed to retrieve courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (course) => {
    if (!user.isApproved) {
      setError('Cannot publish courses: Your profile is pending admin approval.');
      return;
    }
    
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('isPublished', !course.isPublished);

    try {
      await updateCourse(course._id, formData, token);
      setSuccess(`Course "${course.title}" status updated successfully.`);
      await loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to update publishing status.');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this course and all associated enrollments? This action is irreversible.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await deleteCourse(courseId, token);
      setSuccess('Course deleted successfully.');
      await loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to delete course.');
    }
  };

  // Open Edit Dialog
  const startEdit = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDesc(course.description);
    setEditPrice(course.price);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDesc);
    formData.append('price', editPrice);

    try {
      await updateCourse(editingCourse._id, formData, token);
      setSuccess('Course details updated.');
      setEditingCourse(null);
      await loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to edit course details.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-wrapper">
      <div className="courses-header">
        <h1 className="courses-title">My Curricula Catalog</h1>
        <p className="courses-sub">Publish drafted courses, perform detail adjustments, or delete structures.</p>
      </div>

      {error && <div className="courses-error-alert">{error}</div>}
      {success && <div className="courses-success-alert">{success}</div>}

      {courses.length === 0 ? (
        <div className="glass-card courses-empty-card">
          <p>You have not authored any course catalogs yet. Create a course to populate this view.</p>
        </div>
      ) : (
        <div className="glass-card courses-table-card">
          <table className="courses-table">
            <thead>
              <tr className="courses-th-row">
                <th className="courses-th">Course Details</th>
                <th className="courses-th">Category</th>
                <th className="courses-th">Price</th>
                <th className="courses-th">Status</th>
                <th className="courses-th">Syllabus</th>
                <th className="courses-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="courses-tr">
                  <td className="courses-td">
                    <div className="courses-cell-details">
                      <img 
                        src={course.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'} 
                        alt="" 
                        className="courses-thumb" 
                      />
                      <div>
                        <div className="courses-cell-title">{course.title}</div>
                        <div className="courses-cell-level">{course.level}</div>
                      </div>
                    </div>
                  </td>
                  <td className="courses-td">{course.category}</td>
                  <td className="courses-td">{course.price === 0 ? 'Free' : `₹${course.price}`}</td>
                  <td className="courses-td">
                    <span 
                      className="courses-status-badge"
                      style={{
                        backgroundColor: course.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: course.isPublished ? '#10b981' : '#f59e0b'
                      }}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="courses-td">{course.modules?.length || 0} modules</td>
                  <td className="courses-td">
                    <div className="courses-actions-cell">
                      <button 
                        className="courses-action-icon-btn" 
                        onClick={() => handleTogglePublish(course)}
                        title={course.isPublished ? 'Change to Draft' : 'Publish Course'}
                      >
                        {course.isPublished ? <Lock size={16} color="#f59e0b" /> : <Globe size={16} color="#10b981" />}
                      </button>
                      <button 
                        className="courses-action-icon-btn" 
                        onClick={() => startEdit(course)}
                        title="Edit Course Details"
                      >
                        <Edit3 size={16} color="#6366f1" />
                      </button>
                      <button 
                        className="courses-action-icon-btn" 
                        onClick={() => handleViewEnrollments(course)}
                        title="View Enrolled Students"
                      >
                        <Users size={16} color="#10b981" />
                      </button>
                      <button 
                        className="courses-action-icon-btn" 
                        onClick={() => handleDelete(course._id)}
                        title="Delete Course"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editing Dialog Modal Overlay */}
      {editingCourse && (
        <div className="courses-modal-overlay">
          <div className="glass-card courses-modal-card">
            <h3 className="courses-modal-header">Adjust Course Details</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea courses-textarea" 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹ INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editPrice}
                  onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value)))}
                  required
                />
              </div>

              <div className="courses-modal-btns">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingCourse(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrolled Students Modal */}
      {showEnrollmentsCourse && (
        <div className="courses-modal-overlay" onClick={() => setShowEnrollmentsCourse(null)}>
          <div className="glass-card courses-modal-card" style={{ maxWidth: '750px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="courses-modal-header" style={{ marginBottom: 0 }}>
                Enrolled Students: {showEnrollmentsCourse.title}
              </h3>
              <button 
                type="button" 
                className="courses-action-icon-btn" 
                onClick={() => setShowEnrollmentsCourse(null)}
              >
                <X size={18} />
              </button>
            </div>

            {enrollmentsError && <div className="courses-error-alert">{enrollmentsError}</div>}
            
            {loadingEnrollments ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader />
              </div>
            ) : enrollments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No students enrolled in this course yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="courses-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr className="courses-th-row">
                      <th className="courses-th" style={{ padding: '0.75rem' }}>Student</th>
                      <th className="courses-th" style={{ padding: '0.75rem' }}>Email / Phone</th>
                      <th className="courses-th" style={{ padding: '0.75rem' }}>Enrolled On</th>
                      <th className="courses-th" style={{ padding: '0.75rem' }}>Completion Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr) => (
                      <tr key={enr.enrollmentId} className="courses-tr">
                        <td className="courses-td" style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {enr.student?.name || 'Unknown Student'}
                          </div>
                        </td>
                        <td className="courses-td" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                          <div style={{ color: 'var(--text-primary)' }}>{enr.student?.email}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{enr.student?.phone || 'No phone'}</div>
                        </td>
                        <td className="courses-td" style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="courses-td" style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-bar-container" style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div 
                                className="progress-bar-fill" 
                                style={{ 
                                  width: `${enr.progressPercentage}%`, 
                                  height: '100%', 
                                  backgroundColor: enr.isCompleted ? '#10b981' : '#6366f1' 
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '35px' }}>
                              {enr.progressPercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowEnrollmentsCourse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;