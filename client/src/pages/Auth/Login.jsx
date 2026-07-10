import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

export const Login = () => {
  const { loginUser, loginWithGoogle, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const routeByRole = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'instructor') navigate('/instructor');
    else navigate('/student');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      routeByRole(user);
    } catch (error) {
      setErr(error.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Google sends back credentialResponse.credential — the raw ID token.
  // We send that to our backend (POST /api/auth/google) for server-side verification.
  const handleGoogleSuccess = async (credentialResponse) => {
    setErr('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      routeByRole(user);
    } catch (error) {
      setErr(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <div className="login-header">
          <div className="login-logo">🎓</div>
          <h2 className="login-title">Welcome back to EduFlow</h2>
          <p className="login-subtitle">Enter credentials to access your dashboard</p>
        </div>

        {(err || authError) && (
          <div className="login-error-alert">
            <span>{err || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="login-input-wrapper">
              <input
                type="email"
                className="form-input login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="login-label-row">
              <label className="form-label">Password</label>
              <Link to="/forgot-password" className="login-forgot-btn">Forgot Password?</Link>
            </div>
            <div className="login-input-wrapper">
              <input
                type="password"
                className="form-input login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Verifying...' : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
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

        <div className="login-footer">
          <span className="login-footer-text">Don't have an account? </span>
          <Link to="/register" className="login-register-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
