'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, phone: string, password: string, address?: string) => Promise<boolean>;
  updateProfile: (name: string, phone: string, address?: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/check');
      if (response.data.success && response.data.authenticated) {
        setUser({
          id: response.data.user.id,
          name: response.data.user.name || '',
          email: response.data.user.email,
          phone: response.data.user.phone,
          address: response.data.user.address || '',
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        setUser({
          id: response.data.user.id,
          name: response.data.user.name || '',
          email: response.data.user.email,
          phone: response.data.user.phone,
          address: response.data.user.address || '',
        });
        toast.success('Login successful!');
        return true;
      } else {
        toast.error(response.data.error || 'Login failed');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string, address?: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/signup', { name, email, phone, password, address });
      if (response.data.success) {
        toast.success('Account created! Please check your email for OTP.');
        return true;
      } else {
        toast.error(response.data.error || 'Signup failed');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const updateProfile = async (name: string, phone: string, address?: string): Promise<boolean> => {
    try {
      const response = await axios.put('/api/auth/profile', { name, phone, address });
      if (response.data.success) {
        setUser({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone,
          address: response.data.user.address || '',
        });
        toast.success('Profile updated successfully!');
        return true;
      } else {
        toast.error(response.data.error || 'Failed to update profile');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      return false;
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/verify-otp', { email, otp });
      if (response.data.success) {
        toast.success('Email verified! You can now login.');
        return true;
      } else {
        toast.error(response.data.error || 'OTP verification failed');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'OTP verification failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const resendOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/resend-otp', { email });
      if (response.data.success) {
        toast.success('OTP sent! Please check your email.');
        return true;
      } else {
        toast.error(response.data.error || 'Failed to resend OTP');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to resend OTP';
      toast.error(errorMessage);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (response.data.success) {
        toast.success('If the email exists, an OTP has been sent.');
        return true;
      } else {
        toast.error(response.data.error || 'Failed to send OTP');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP';
      toast.error(errorMessage);
      return false;
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/reset-password', { email, otp, newPassword });
      if (response.data.success) {
        toast.success('Password reset successful! You can now login.');
        return true;
      } else {
        toast.error(response.data.error || 'Password reset failed');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Password reset failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        updateProfile,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
