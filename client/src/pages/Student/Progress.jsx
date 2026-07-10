import React, { useState, useEffect } from 'react';
import { getStats } from '../../api/userApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader } from '../../components/Loader';
import { Award, Target, CheckCircle2, Trophy } from 'lucide-react';
import './Progress.css'; // Importing separated styling configurations

export const Progress = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 

  const loadStats = async () => {
    try {
      const res = await getStats(token);
      setStats(res.stats);
    } catch (err) {
      setError(err.message || 'Failed to retrieve progress details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStats();
    }
  }, [token]);

  if (loading) return <Loader />;

  const activeEnrollments = stats?.activeEnrollments || [];
  const completedCourses = activeEnrollments.filter(e => e.isCompleted);

  // Calculate total lessons and total checked lessons
  let totalLessonsCount = 0;
  let completedLessonsCount = 0;

  activeEnrollments.forEach((e) => {
    if (e.course?.modules) {
      totalLessonsCount += e.course.modules.length;
    }
    completedLessonsCount += e.completedLessons?.length || 0;
  });

  const aggregateProgress = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  return (
    <div className="page-wrapper">
      <div className="progress-header">
        <h1 className="progress-title">Learning Metrics & Progress</h1>
        <p className="progress-subtitle">Review your courses milestones, certifications, and active metrics.</p>
      </div>

      {error && <div className="progress-error-alert">{error}</div>}

      {/* Progress Cards Row */}
      <div className="stat-grid progress-metrics-row">
        <div className="glass-card progress-metric-card">
          <Target size={24} color="#6366f1" />
          <div className="progress-metric-info">
            <span className="progress-metric-label">Overall Curricula Completion</span>
            <h3 className="progress-metric-val">{aggregateProgress}%</h3>
          </div>
        </div>

        <div className="glass-card progress-metric-card">
          <CheckCircle2 size={24} color="#10b981" />
          <div className="progress-metric-info">
            <span className="progress-metric-label">Finished Lessons</span>
            <h3 className="progress-metric-val">{completedLessonsCount} / {totalLessonsCount}</h3>
          </div>
        </div>

        <div className="glass-card progress-metric-card">
          <Trophy size={24} color="#f59e0b" />
          <div className="progress-metric-info">
            <span className="progress-metric-label">Earned Certificates</span>
            <h3 className="progress-metric-val">{completedCourses.length}</h3>
          </div>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="progress-section">
        <h2 className="progress-sec-title">My Certifications</h2>
        {completedCourses.length === 0 ? (
          <div className="glass-card progress-empty-card">
            <p>Complete any course 100% to generate a certificate of completion here.</p>
          </div>
        ) : (
          <div className="progress-certificate-grid">
            {completedCourses.map((enr) => (
              enr.course && (
                <div key={enr._id} className="glass-card progress-cert-card">
                  <div className="progress-cert-ribbon">
                    <Award size={36} color="#fbbf24" />
                  </div>
                  <h3 className="progress-cert-course-title">{enr.course.title}</h3>
                  <p className="progress-cert-desc">Authorized by EduFlow Platform</p>
                  <div className="progress-cert-footer">
                    <span className="progress-cert-date">
                      Issued: {new Date(enr.completedAt || enr.enrolledAt).toLocaleDateString()}
                    </span>
                    <button 
                      className="btn btn-secondary progress-print-btn" 
                      onClick={() => window.print()}
                    >
                      Print Preview
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Detailed progress bars */}
      <div className="progress-section">
        <h2 className="progress-sec-title">Course breakdown</h2>
        {activeEnrollments.length === 0 ? (
          <div className="glass-card progress-empty-card">
            <p>Enroll in a course to view detailed breakdown analysis.</p>
          </div>
        ) : (
          <div className="progress-breakdown-list">
            {activeEnrollments.map((enr) => (
              enr.course && (
                <div key={enr._id} className="glass-card progress-breakdown-card">
                  <div className="progress-breakdown-header">
                    <h4 className="progress-breakdown-course">{enr.course.title}</h4>
                    <span className="progress-breakdown-percent">
                      {enr.progressPercentage}% ({enr.completedLessons?.length || 0}/{enr.course.modules?.length || 0} lessons)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{
                        width: `${enr.progressPercentage}%`,
                        backgroundColor: enr.isCompleted ? '#10b981' : '#6366f1'
                      }}
                    ></div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;