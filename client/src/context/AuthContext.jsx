import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { getProfile } from '../api/userApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('eduflow_token');
    const storedUser = localStorage.getItem('eduflow_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Optionally refresh profile to check suspension
      checkSession(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const checkSession = async (authToken) => {
    try {
      const response = await getProfile(authToken);
      setUser(response.user);
      localStorage.setItem('eduflow_user', JSON.stringify(response.user));
    } catch (err) {
      // Token expired or account suspended
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('eduflow_token', data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password, role, phone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(name, email, password, role, phone);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.verifyOtp(email, otp);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('eduflow_token', data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handles Google Sign-In: sends the credential (ID token) from @react-oauth/google
  // to the backend, which verifies it with Google and returns our own JWT.
  const loginWithGoogle = async (credential, defaultRole = 'student') => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.loginWithGoogle(credential, defaultRole);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('eduflow_token', data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registers a new admin account using email/password + secret key
  const registerAdmin = async (name, email, password, adminSecret) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.registerAdmin(name, email, password, adminSecret);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('eduflow_token', data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registers (or logs in) an admin account using Google OAuth + secret key
  const registerAdminWithGoogle = async (credential, adminSecret) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.googleAdminRegister(credential, adminSecret);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('eduflow_token', data.token);
      localStorage.setItem('eduflow_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('eduflow_token');
    localStorage.removeItem('eduflow_user');
    navigate('/');   // Always go to the landing page after logout
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      loginUser,
      registerUser,
      verifyOtp,
      loginWithGoogle,
      registerAdmin,
      registerAdminWithGoogle,
      logout,
      refreshProfile: () => checkSession(token)
    }}>
      {children}
    </AuthContext.Provider>
  );
};
