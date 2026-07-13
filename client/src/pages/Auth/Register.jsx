import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { GoogleLogin } from '@react-oauth/google';
import './Register.css';

export const Register = () => {
  const { registerUser, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const routeByRole = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'instructor') navigate('/instructor');
    else navigate('/student');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await registerUser(name, email, password, role);
      routeByRole(res);
    } catch (error) {
      setErr(error.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Google sign-up: uses the role the user selected.
  const handleGoogleSuccess = async (credentialResponse) => {
    setErr('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential, role);
      routeByRole(user);
    } catch (error) {
      setErr(error.message || 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="glass-card register-card">
        <div className="register-header">
          <div className="register-logo">🎓</div>
          <h2 className="register-title">Join EduFlow Today</h2>
          <p className="register-subtitle">Create your profile to start teaching or learning</p>
        </div>

        {err && (
          <div className="register-error-alert">
            <span>{err}</span>
          </div>
        )}

        {/* Role selector above the form so it also applies to Google sign-up */}
        <div className="form-group">
          <label className="form-label">I want to register as a</label>
          <div className="register-input-wrapper">
            <select
              className="form-select register-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student / Learner</option>
              <option value="instructor">Instructor / Educator</option>
            </select>
          </div>
        </div>

        {role === 'instructor' && (
          <div className="register-info-alert">
            <span>ℹ️ Instructor accounts require approval from an administrator before publishing courses.</span>
          </div>
        )}

        <div className="auth-divider">
          <span>or sign up with Google</span>
        </div>

        <div className="google-auth-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErr('Google sign-up failed. Please try again.')}
            theme="filled_black"
            shape="pill"
            size="large"
            width="320"
            text="signup_with"
          />
        </div>

        <div className="auth-divider">
          <span>or fill in details</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="register-input-wrapper">
              <input
                type="text"
                className="form-input register-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="register-input-wrapper">
              <input
                type="email"
                className="form-input register-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="register-input-wrapper">
              <input
                type="password"
                className="form-input register-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary register-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : <span>Sign Up</span>}
          </button>
        </form>

        <div className="register-footer">
          <span className="register-footer-text">Already have an account? </span>
          <Link to="/login" className="register-login-link">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
