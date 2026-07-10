import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { GoogleLogin } from '@react-oauth/google';
import { resendOtp } from '../../api/authApi.js';
import './Register.css';

export const Register = () => {
  const { registerUser, verifyOtp, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [localPhone, setLocalPhone] = useState('');
  const [role, setRole] = useState('student');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
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
      const fullPhone = `${countryCode}${localPhone}`;
      const res = await registerUser(name, email, password, role, fullPhone);
      if (res && res.requiresVerification) {
        setShowOtp(true);
        setSuccessMsg(res.message || 'OTP verification code sent to your registered mobile number.');
      } else {
        routeByRole(res);
      }
    } catch (error) {
      setErr(error.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccessMsg('');
    if (!otp || otp.length !== 6) {
      setErr('Please enter a valid 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const user = await verifyOtp(email, otp);
      routeByRole(user);
    } catch (error) {
      setErr(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErr('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await resendOtp(email);
      setSuccessMsg(res.message || 'OTP has been resent successfully.');
    } catch (error) {
      setErr(error.message || 'Failed to resend OTP.');
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

  if (showOtp) {
    return (
      <div className="register-container">
        <div className="glass-card register-card">
          <div className="register-header">
            <div className="register-logo">📱</div>
            <h2 className="register-title">Verify Phone</h2>
            <p className="register-subtitle">Enter the 6-digit code sent to your mobile number</p>
          </div>

          {err && (
            <div className="register-error-alert">
              <span>{err}</span>
            </div>
          )}

          {successMsg && (
            <div className="register-info-alert">
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">One-Time Password (OTP)</label>
              <div className="register-input-wrapper">
                <input
                  type="text"
                  maxLength={6}
                  className="form-input register-input"
                  style={{ textAlign: 'center', letterSpacing: '0.4rem', fontSize: '1.4rem', fontWeight: 'bold' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary register-submit-btn"
              disabled={loading}
            >
              {loading ? 'Verifying OTP...' : <span>Verify OTP</span>}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.875rem' }}>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', textDecoration: 'underline' }}
              onClick={handleResendOtp}
              disabled={loading}
            >
              Resend OTP Code
            </button>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', textDecoration: 'underline' }}
              onClick={() => setShowOtp(false)}
            >
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <label className="form-label">Mobile Number</label>
            <div className="phone-input-container">
              <select
                className="form-select phone-country-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+92">+92 (PK)</option>
                <option value="+880">+880 (BD)</option>
                <option value="+977">+977 (NP)</option>
                <option value="+94">+94 (LK)</option>
                <option value="+971">+971 (AE)</option>
                <option value="+65">+65 (SG)</option>
              </select>
              <input
                type="tel"
                className="form-input phone-number-input"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
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
