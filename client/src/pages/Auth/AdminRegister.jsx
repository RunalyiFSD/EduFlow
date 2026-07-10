import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ShieldCheck, Eye, EyeOff, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './AdminRegister.css';

export const AdminRegister = () => {
  const { registerAdmin, registerAdminWithGoogle } = useAuth();
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [showSecret, setShowSecret]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [googlePending, setGooglePending] = useState(false); // credential waiting for secret
  const [pendingCredential, setPendingCredential] = useState(null);
  const [err, setErr]                 = useState('');
  const [success, setSuccess]         = useState('');
  const navigate = useNavigate();

  // ── Email / password flow ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!adminSecret.trim()) {
      setErr('Admin secret key is required.');
      return;
    }
    setLoading(true);
    try {
      await registerAdmin(name, email, password, adminSecret);
      navigate('/admin');
    } catch (error) {
      setErr(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth flow ────────────────────────────────────────────
  // Google returns the credential first; we then ask for the secret key
  // before sending anything to the backend.
  const handleGoogleSuccess = (credentialResponse) => {
    setErr('');
    setPendingCredential(credentialResponse.credential);
    setGooglePending(true);   // show the secret-key prompt
  };

  const handleGoogleConfirm = async () => {
    if (!adminSecret.trim()) {
      setErr('Please enter the admin secret key to continue.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await registerAdminWithGoogle(pendingCredential, adminSecret);
      navigate('/admin');
    } catch (error) {
      setErr(error.message || 'Google admin registration failed.');
      setGooglePending(false);
      setPendingCredential(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reg-container">
      <div className="glass-card admin-reg-card">

        {/* Header */}
        <div className="admin-reg-header">
          <div className="admin-reg-badge">
            <ShieldCheck size={28} color="#6366f1" />
          </div>
          <h2 className="admin-reg-title">Create Admin Account</h2>
          <p className="admin-reg-subtitle">
            You must provide the platform admin secret key to register
          </p>
        </div>

        {/* Error / success banners */}
        {err && (
          <div className="admin-reg-error">
            <span>{err}</span>
          </div>
        )}
        {success && (
          <div className="admin-reg-success">
            <span>{success}</span>
          </div>
        )}

        {/* ── Google pending: just ask for the secret key ── */}
        {googlePending ? (
          <div className="admin-reg-google-confirm">
            <p className="admin-reg-confirm-text">
              Google sign-in was successful. Enter the admin secret key to complete your admin registration.
            </p>

            <div className="form-group">
              <label className="form-label">Admin Secret Key</label>
              <div className="admin-reg-secret-wrapper">
                <KeyRound size={16} className="admin-reg-secret-icon" />
                <input
                  type={showSecret ? 'text' : 'password'}
                  className="form-input admin-reg-input admin-reg-secret-input"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter admin secret key"
                  autoFocus
                />
                <button
                  type="button"
                  className="admin-reg-eye-btn"
                  onClick={() => setShowSecret(!showSecret)}
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary admin-reg-submit-btn"
              onClick={handleGoogleConfirm}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Complete Admin Registration'}
            </button>

            <button
              type="button"
              className="admin-reg-cancel-btn"
              onClick={() => { setGooglePending(false); setPendingCredential(null); setErr(''); }}
            >
              ← Cancel, try another method
            </button>
          </div>
        ) : (
          <>
            {/* ── Main form ── */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input admin-reg-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Admin"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input admin-reg-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input admin-reg-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Admin Secret Key
                  <span className="admin-reg-label-hint"> — provided by your platform owner</span>
                </label>
                <div className="admin-reg-secret-wrapper">
                  <KeyRound size={16} className="admin-reg-secret-icon" />
                  <input
                    type={showSecret ? 'text' : 'password'}
                    className="form-input admin-reg-input admin-reg-secret-input"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Enter the admin secret key"
                    required
                  />
                  <button
                    type="button"
                    className="admin-reg-eye-btn"
                    onClick={() => setShowSecret(!showSecret)}
                    tabIndex={-1}
                  >
                    {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary admin-reg-submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : (
                  <>
                    <ShieldCheck size={17} />
                    <span>Create Admin Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>or register with Google</span>
            </div>

            <p className="admin-reg-google-hint">
              After Google sign-in you'll be asked for the admin secret key.
            </p>

            <div className="google-auth-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErr('Google sign-in failed. Please try again.')}
                theme="filled_black"
                shape="pill"
                size="large"
                width="320"
                text="signup_with"
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="admin-reg-footer">
          <Link to="/admin-login" className="admin-reg-link">
            Already have an admin account? Log In
          </Link>
          <span className="admin-reg-dot">·</span>
          <Link to="/" className="admin-reg-link">← Landing Page</Link>
        </div>

      </div>
    </div>
  );
};

export default AdminRegister;
