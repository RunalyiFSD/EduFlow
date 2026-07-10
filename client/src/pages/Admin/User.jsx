import React, { useState, useEffect } from 'react';
import { getAdminUsers, updateUserStatus, deleteAdminUser } from '../../api/userApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader } from '../../components/Loader';
import { Check, X, ShieldAlert, User, Trash2 } from 'lucide-react';
import './User.css';

export const Users = () => {
  const { token, user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers(token);
      setUsers(data.users);
    } catch (err) {
      setError(err.message || 'Failed to retrieve user registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApprove = async (user) => {
    setError('');
    setSuccess('');
    try {
      await updateUserStatus(user._id, { isApproved: !user.isApproved }, token);
      setSuccess(`Instructor "${user.name}" status updated.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to change instructor status.');
    }
  };

  const handleToggleSuspend = async (user) => {
    if (user._id === currentUser.id) {
      setError('Cannot suspend your own administrator account!');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await updateUserStatus(user._id, { isSuspended: !user.isSuspended }, token);
      setSuccess(`User "${user.name}" status changed: Suspended=${!user.isSuspended}.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to modify account access rights.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser.id) {
      setError('Cannot delete your own administrator account!');
      return;
    }

    const confirmed = window.confirm(`Are you absolutely sure you want to permanently delete user "${user.name}" (${user.email})? This action is irreversible and will delete all associated data (courses, enrollments, notifications).`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      await deleteAdminUser(user._id, token);
      setSuccess(`User "${user.name}" was successfully deleted.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete the user.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-wrapper">
      <div className="users-header">
        <h1 className="users-title">Manage System Users</h1>
        <p className="users-sub">Review profiles, promote instructors, and manage suspensions.</p>
      </div>

      {error && <div className="users-error-alert">{error}</div>}
      {success && <div className="users-success-alert">{success}</div>}

      <div className="glass-card users-card">
        <table className="users-table">
          <thead>
            <tr className="users-th-row">
              <th className="users-th">Profile Info</th>
              <th className="users-th">Email Address</th>
              <th className="users-th">Assigned Role</th>
              <th className="users-th">Verification</th>
              <th className="users-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="users-tr">
                <td className="users-td">
                  <div className="users-cell-profile">
                    <div className="users-avatar">
                      <User size={16} color="#94a3b8" />
                    </div>
                    <div>
                      <div className="users-name">{u.name}</div>
                      <div className="users-date-joined">
                        Registered: {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="users-td">{u.email}</td>
                <td className="users-td">
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                </td>
                <td className="users-td">
                  {u.role === 'instructor' ? (
                    <span className={`users-status-badge ${u.isApproved ? 'users-status-approved' : 'users-status-pending'}`}>
                      {u.isApproved ? 'Approved' : 'Pending Verification'}
                    </span>
                  ) : (
                    <span className="users-na-text">N/A</span>
                  )}
                </td>
                <td className="users-td">
                  <div className="users-actions-cell">
                    {u.role === 'instructor' && (
                      <button 
                        className={`users-action-btn ${u.isApproved ? 'btn-verify-block' : 'btn-verify-approve'}`}
                        onClick={() => handleToggleApprove(u)}
                        title={u.isApproved ? 'Revoke Instructor Access' : 'Approve Instructor Profile'}
                      >
                        {u.isApproved ? <X size={15} /> : <Check size={15} />}
                        <span>{u.isApproved ? 'Block profile' : 'Verify'}</span>
                      </button>
                    )}

                    <button 
                      className={`users-action-btn ${u.isSuspended ? 'btn-suspend-activate' : 'btn-suspend-ban'}`}
                      onClick={() => handleToggleSuspend(u)}
                      disabled={u._id === currentUser.id}
                      title={u.isSuspended ? 'Lift Account Suspension' : 'Suspend Account'}
                    >
                      <ShieldAlert size={15} />
                      <span>{u.isSuspended ? 'Activate' : 'Suspend'}</span>
                    </button>

                    <button 
                      className="users-action-btn btn-user-delete"
                      onClick={() => handleDeleteUser(u)}
                      disabled={u._id === currentUser.id}
                      title="Delete User permanently"
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;