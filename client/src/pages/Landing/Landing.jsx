import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCourses } from '../../api/courseApi';
import {
  GraduationCap,
  BookOpen,
  Clock,
  User,
  CheckCircle2,
  Award,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookOpenCheck
} from 'lucide-react';
import './Landing.css';

export const Landing = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    // Fallbacks to guarantee 4 cards are displayed under all circumstances
    // (including if the backend server isn't running yet)
    const fallbackCourses = [
      {
        _id: "c-react",
        title: "React Fundamentals",
        description: "Learn the core concepts of React, including components, state, props, hooks, and routing. Build modern dynamic applications from scratch.",
        category: "Development",
        level: "Beginner",
        price: 0,
        coverImageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
        instructor: { name: "Jane Doe" }
      },
      {
        _id: "c-css",
        title: "Advanced CSS Grid & Flexbox",
        description: "Master modern layout techniques. Build complex responsive grid layouts and learn grid properties in detail.",
        category: "Design",
        level: "Intermediate",
        price: 29,
        coverImageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
        instructor: { name: "Jane Doe" }
      },
      {
        _id: "c-business",
        title: "Business Analytics 101",
        description: "Understand business analytics principles and techniques. Learn data analysis tools and frameworks to support decision making.",
        category: "Business",
        level: "Intermediate",
        price: 49,
        coverImageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        instructor: { name: "Jane Doe" }
      },
      {
        _id: "c-node",
        title: "Node.js & Express Basics",
        description: "Build scalable backend APIs and web applications using Node.js, Express, and databases. Learn asynchronous programming and routing.",
        category: "Development",
        level: "Intermediate",
        price: 19,
        coverImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
        instructor: { name: "Jane Doe" }
      }
    ];

    const loadCourses = async () => {
      let published = [];
      try {
        // Public catalog endpoint - no token needed for anonymous visitors
        const data = await getCourses({ isPublished: true });
        published = data.courses || [];
      } catch (err) {
        // Backend unreachable or empty catalog - fall back below so the
        // welcome page still looks complete for visitors.
        published = [];
      }

      // Combine database courses and fallback courses to ensure we hit exactly 4 distinct courses
      const merged = [...published];
      fallbackCourses.forEach(fb => {
        if (!merged.some(c => c._id === fb._id || c.title.toLowerCase() === fb.title.toLowerCase())) {
          merged.push(fb);
        }
      });

      setCourses(merged.slice(0, 4));
    };

    loadCourses();
  }, []);

  const handleCourseClick = () => {
    if (token && user) {
      navigate(`/${user.role}`);
    } else {
      navigate('/login');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    return `/${user.role}`;
  };

  return (
    <div className="landing-page">
      {/* Background decoration blur elements */}
      <div className="landing-glow landing-glow-1"></div>
      <div className="landing-glow landing-glow-2"></div>
      <div className="landing-glow landing-glow-3"></div>

      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-header-container">
          <div className="landing-logo-container" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="landing-logo-icon">
              <GraduationCap size={28} />
            </div>
            <span className="landing-logo-text">EduFlow</span>
          </div>

          <nav className="landing-nav">
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#courses" className="landing-nav-link">Courses</a>
          </nav>

          <div className="landing-auth-buttons">
            {token && user ? (
              <Link to={getDashboardLink()} className="btn btn-primary landing-btn-dashboard">
                <span>Go to Dashboard</span>
                <ChevronRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn-login">Log In</Link>
                <Link to="/register" className="btn btn-primary landing-btn-signup">Sign Up</Link>
                <Link to="/admin-login" className="landing-btn-admin">Admin</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          <div className="landing-hero-content">
            <div className="landing-badge-promo">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Next Generation Learning Platform</span>
            </div>
            <h1 className="landing-hero-title">
              Shape Your Future With <span className="text-gradient">EduFlow</span>
            </h1>
            <p className="landing-hero-subtitle">
              EduFlow is an interactive learning platform that connects students with industry-expert instructors. Explore dynamic curricula, track your study milestones, and achieve academic and career excellence.
            </p>
            <div className="landing-hero-ctas">
              <a href="#courses" className="btn btn-primary btn-hero-primary">
                <span>Explore Courses</span>
                <ArrowRight size={18} />
              </a>
              <Link to={token ? getDashboardLink() : "/register"} className="btn btn-secondary btn-hero-secondary">
                <span>Get Started Free</span>
              </Link>
            </div>
            <div className="landing-hero-stats">
              <div className="landing-stat-item">
                <span className="stat-number">15k+</span>
                <span className="stat-label">Active Learners</span>
              </div>
              <div className="landing-divider"></div>
              <div className="landing-stat-item">
                <span className="stat-number">250+</span>
                <span className="stat-label">Curated Courses</span>
              </div>
              <div className="landing-divider"></div>
              <div className="landing-stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction Rate</span>
              </div>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="visual-card-wrapper">
              <div className="glass-card visual-card main-visual-card">
                <div className="visual-card-header">
                  <div className="visual-dot dot-red"></div>
                  <div className="visual-dot dot-yellow"></div>
                  <div className="visual-dot dot-green"></div>
                  <span className="visual-window-title">eduflow-learning-portal.js</span>
                </div>
                <div className="visual-card-body">
                  <pre className="code-snippet">
                    <code>
                      <span className="code-keyword">const</span> learningPlatform = <span className="code-keyword">new</span> <span className="code-class">EduFlow</span>(&#123;<br />
                      &nbsp;&nbsp;studentCentered: <span className="code-value">true</span>,<br />
                      &nbsp;&nbsp;interactiveModules: <span className="code-value">true</span>,<br />
                      &nbsp;&nbsp;progressTracking: <span className="code-value">true</span>,<br />
                      &nbsp;&nbsp;learningSuccess: <span className="code-keyword">async</span> () = &#123;<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="code-keyword">await</span> student.study();<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="code-keyword">return</span> <span className="code-string">"🚀 Career Growth"</span>;<br />
                      &nbsp;&nbsp;&#125;<br />
                      &#125;);
                    </code>
                  </pre>
                </div>
              </div>
              <div className="glass-card visual-sub-card sub-card-1">
                <div className="sub-card-icon bg-indigo-glow">
                  <BookOpenCheck size={20} className="text-indigo" />
                </div>
                <div className="sub-card-text">
                  <span className="sub-card-title">Structured Learning</span>
                  <span className="sub-card-desc">Interactive curriculum models</span>
                </div>
              </div>
              <div className="glass-card visual-sub-card sub-card-2">
                <div className="sub-card-icon bg-emerald-glow">
                  <Award size={20} className="text-emerald" />
                </div>
                <div className="sub-card-text">
                  <span className="sub-card-title">Progress Telemetry</span>
                  <span className="sub-card-desc">Real-time status updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information / About Section */}
      <section id="about" className="landing-about">
        <div className="landing-section-container">
          <div className="landing-section-header">
            <h2 className="section-title">Designed for Next-Gen Learning</h2>
            <p className="section-subtitle">EduFlow bridges the gap between traditional learning and interactive modern instruction.</p>
          </div>
          <div className="about-grid">
            <div className="glass-card about-card">
              <div className="about-card-icon icon-blue">
                <GraduationCap size={24} />
              </div>
              <h3 className="about-card-title">Empowered Students</h3>
              <p className="about-card-text">
                Browse our catalog, enroll instantly in interactive modules, study at your own pace, and view detailed logs of your learning metrics.
              </p>
            </div>
            <div className="glass-card about-card">
              <div className="about-card-icon icon-emerald">
                <User size={24} />
              </div>
              <h3 className="about-card-title">Professional Instructors</h3>
              <p className="about-card-text">
                Build course content, organize dynamic learning structures (lectures, docs, videos), track enrollments, and manage course settings.
              </p>
            </div>
            <div className="glass-card about-card">
              <div className="about-card-icon icon-amber">
                <ShieldCheck size={24} />
              </div>
              <h3 className="about-card-title">Platform Administration</h3>
              <p className="about-card-text">
                Approve instructors, manage all courses, suspend accounts, and view security audit logs to maintain educational integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features List Section */}
      <section id="features" className="landing-features">
        <div className="landing-section-container">
          <div className="features-layout">
            <div className="features-visual">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"
                alt="Students studying"
                className="features-img"
              />
              <div className="features-img-overlay"></div>
            </div>
            <div className="features-content">
              <h2 className="section-title text-left">Innovative Features Built For Excellence</h2>
              <p className="section-subtitle text-left">
                Every tool you need to guide, learn, or manage educational paths efficiently is available in one cohesive layout.
              </p>

              <ul className="features-list">
                <li className="features-list-item">
                  <div className="feature-marker">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="feature-detail">
                    <h4>Interactive Video & Document Playback</h4>
                    <p>Engage with lectures, step-by-step reading materials, and external video sources directly inside the player.</p>
                  </div>
                </li>
                <li className="features-list-item">
                  <div className="feature-marker">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="feature-detail">
                    <h4>Learning Milestones & Progress Tracking</h4>
                    <p>Tick off completed tasks, check off modules, and track completion ratios through visual telemetry indicators.</p>
                  </div>
                </li>
                <li className="features-list-item">
                  <div className="feature-marker">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="feature-detail">
                    <h4>Course Authoring Suite</h4>
                    <p>Instructors can draft, re-order, publish, or suspend structured learning components using intuitive drag-and-drop mechanics.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="landing-courses">
        <div className="landing-section-container">
          <div className="landing-section-header">
            <div className="section-pre">
              <BookOpen size={16} className="text-indigo" />
              <span>Explore Curriculum</span>
            </div>
            <h2 className="section-title">Featured EduFlow Courses</h2>
            <p className="section-subtitle">
              Expand your skill set with these four premium courses highly demanded in today's tech and business ecosystems.
            </p>
          </div>

          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} className="glass-card course-card" onClick={handleCourseClick}>
                <div className="course-card-image-wrapper">
                  <img src={course.coverImageUrl} alt={course.title} className="course-card-img" />
                  <div className="course-card-badge-row">
                    <span className="course-badge category-badge">{course.category}</span>
                    <span className="course-badge level-badge">{course.level}</span>
                  </div>
                </div>
                <div className="course-card-content">
                  <h3 className="course-card-title">{course.title}</h3>
                  <p className="course-card-desc">{course.description}</p>
                  <div className="course-card-meta">
                    <div className="course-instructor">
                      <User size={14} className="text-secondary" />
                      <span>{course.instructor?.name || 'EduFlow Educator'}</span>
                    </div>
                    <div className="course-price-badge">
                      {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </div>
                  </div>
                  <button className="btn btn-secondary course-card-btn">
                    <span>View Course</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="courses-footer">
            <Link to={token ? getDashboardLink() : "/register"} className="btn btn-primary btn-courses-more">
              <span>Create Account To Enroll</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-brand-side">
            <div className="landing-logo-container">
              <div className="landing-logo-icon">
                <GraduationCap size={24} />
              </div>
              <span className="landing-logo-text">EduFlow</span>
            </div>
            <p className="footer-desc">
              Building the next generation of scalable and engaging learning management system interfaces.
            </p>
          </div>

          <div className="footer-links-side">
            <div className="footer-link-group">
              <h4>Platform</h4>
              <a href="#about">About</a>
              <a href="#features">Features</a>
              <a href="#courses">Courses</a>
            </div>
            <div className="footer-link-group">
              <h4>Account</h4>
              {token && user ? (
                <Link to={getDashboardLink()}>My Dashboard</Link>
              ) : (
                <>
                  <Link to="/login">Log In</Link>
                  <Link to="/register">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} EduFlow Inc. All rights reserved. Designed with premium aesthetics.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
