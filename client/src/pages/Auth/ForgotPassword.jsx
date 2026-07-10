import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/authApi.js';
import { Mail, ArrowLeft } from 'lucide-react';
import './ForgotPassword.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="glass-card forgot-card">
        <div className="forgot-header">
          <div className="forgot-logo">🔒</div>
          <h2 className="forgot-title">Reset Password</h2>
          <p className="forgot-subtitle">Enter your email to receive recovery instructions</p>
        </div>

        {error && (
          <div className="forgot-error-alert">
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="forgot-success-alert">
            <p className="forgot-success-text">
              📬 Password reset guidelines have been dispatched to <strong>{email}</strong>. Please check your inbox.
            </p>
            <Link to="/login" className="btn btn-primary forgot-back-to-login-btn">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="forgot-input-wrapper">
                <Mail className="forgot-input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-input forgot-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary forgot-submit-btn" 
              disabled={loading}
            >
              {loading ? 'Sending Request...' : 'Send Recovery Instructions'}
            </button>
            
            <div className="forgot-back-row">
              <Link to="/login" className="forgot-back-link">
                <ArrowLeft size={16} />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;