// src/components/RegisterModal.tsx

'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  if (!isOpen) return null;

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register({ 
        email, 
        password, 
        confirm_password: confirmPassword 
      });
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Registration failed:', error);
      setGeneralError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { text: '', color: '', width: '0%' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 2) return { text: 'Weak', color: 'bg-red-500', width: '33%' };
    if (strength <= 4) return { text: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { text: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-white/20 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="h-6 w-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
          </div>
          <p className="text-white/60 text-sm">Join to save and manage your automata</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error */}
          {generalError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-white/80 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Password Strength:</span>
                  <span className={passwordStrength.text === 'Strong' ? 'text-green-400' : passwordStrength.text === 'Medium' ? 'text-yellow-400' : 'text-red-400'}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="text-red-400 text-sm mt-1 flex items-start gap-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="register-confirm-password" className="block text-sm font-medium text-white/80 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            {confirmPassword && password === confirmPassword && (
              <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Passwords match
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-200 text-xs font-semibold mb-2">Password Requirements:</p>
            <ul className="text-blue-300/80 text-xs space-y-1">
              <li className="flex items-center gap-2">
                {password.length >= 8 ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <div className="h-3 w-3 rounded-full border border-white/30" />}
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                {/[A-Z]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <div className="h-3 w-3 rounded-full border border-white/30" />}
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                {/[a-z]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <div className="h-3 w-3 rounded-full border border-white/30" />}
                One lowercase letter
              </li>
              <li className="flex items-center gap-2">
                {/\d/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <div className="h-3 w-3 rounded-full border border-white/30" />}
                One number
              </li>
              <li className="flex items-center gap-2">
                {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <div className="h-3 w-3 rounded-full border border-white/30" />}
                One special character (!@#$%...)
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer - Switch to Login */}
        <div className="p-6 pt-0 border-t border-white/10">
          <p className="text-center text-white/60 text-sm">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}