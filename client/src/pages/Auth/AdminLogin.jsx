import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { LogIn, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './AdminLogin.css';

export const AdminLogin = () => {
  const { loginUser, loginWithGoogle, logout } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      if (user.role !== 'admin') {
        // Session was set in AuthContext — clear it immediately so a
        // non-admin can't access protected routes after seeing this error
        logout();
        throw new Error('Access denied. This portal is for administrators only.');
      }
      navigate('/admin');
    } catch (error) {
      setErr(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErr('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      if (user.role !== 'admin') {
        // Same as above — the Google user authenticated but is not an admin.
        // Clear the session before showing the denial message.
        logout();
        throw new Error('Access denied. This Google account is not linked to an admin profile.');
      }
      navigate('/admin');
    } catch (error) {
      setErr(error.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="glass-card admin-login-card">

        <div className="admin-login-header">
          <div className="admin-login-badge">
            <ShieldCheck size={28} color="#6366f1" />
          </div>
          <h2 className="admin-login-title">Admin Portal</h2>
          <p className="admin-login-subtitle">
            Restricted access — EduFlow administrators only
          </p>
        </div>

        {err && (
          <div className="admin-login-error">
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eduflow.com"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary admin-login-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={17} />
                <span>Access Admin Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or sign in with Google</span>
        </div>

        <div className="google-auth-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErr('Google sign-in failed. Please try again.')}
            theme="filled_black"
            shape="pill"
            size="large"
            width="320"
          />
        </div>

        <div className="admin-login-footer">
          <Link to="/" className="admin-login-back-link">
            ← Back to Landing Page
          </Link>
          <span className="admin-login-divider-dot">·</span>
          <Link to="/login" className="admin-login-back-link">
            User Login
          </Link>
          <span className="admin-login-divider-dot">·</span>
          <Link to="/admin-register" className="admin-login-back-link">
            Create Admin Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
