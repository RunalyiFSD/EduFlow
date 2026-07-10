import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api/authApi.js';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import './ResetPassword.css';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="glass-card reset-card">
        <div className="reset-header">
          <div className="reset-logo">🔒</div>
          <h2 className="reset-title">Create New Password</h2>
          <p className="reset-subtitle">Enter your new secure password below</p>
        </div>

        {error && (
          <div className="reset-error-alert">
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="reset-success-alert">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <p className="reset-success-text">
              🎉 Password updated successfully!
            </p>
            <p className="reset-redirect-text" style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'center' }}>
              You will be redirected to the login page shortly, or you can click below.
            </p>
            <Link to="/login" className="btn btn-primary reset-back-to-login-btn" style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="reset-input-wrapper">
                <Lock className="reset-input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-input reset-input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="reset-input-wrapper">
                <Lock className="reset-input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-input reset-input" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary reset-submit-btn" 
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
            
            <div className="reset-back-row">
              <Link to="/login" className="reset-back-link">
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

export default ResetPassword;
