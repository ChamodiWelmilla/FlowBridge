import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { authApi } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (enterpriseName: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setEnterpriseName('');
      setPassword('');
      setError('');
    }
  }, [isOpen, isRegister]);

  if (!isOpen) return null;

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!enterpriseName.trim()) {
        setError('Enterprise / Company Name cannot be empty.');
        return;
      }
      if (!email.trim()) {
        setError('Email address cannot be empty.');
        return;
      }
      if (!isValidEmail(email.trim())) {
        setError('Please enter a valid email address format (e.g. admin@company.com).');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    } else {
      if (!enterpriseName.trim()) {
        setError('Enterprise Name is required for login.');
        return;
      }
      if (!password) {
        setError('Password is required.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        await authApi.register(email.trim(), enterpriseName.trim(), password);
        const res = await authApi.login(enterpriseName.trim(), password);
        onSuccess(res.enterpriseName || enterpriseName.trim());
      } else {
        const res = await authApi.login(enterpriseName.trim(), password);
        onSuccess(res.enterpriseName || enterpriseName.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-sage-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-sage-100 p-3 rounded-xl text-[#8B9A6E] border border-sage-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isRegister ? 'Register Enterprise Account' : 'Enterprise Login'}
            </h2>
            <p className="text-xs text-gray-500">
              {isRegister ? 'Enter details to register your enterprise' : 'Enter enterprise credentials to access dashboard'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Enterprise / Company Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                autoComplete="off"
                value={enterpriseName}
                onChange={(e) => setEnterpriseName(e.target.value)}
                placeholder="e.g. Apple Inc. or TSMC"
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
              />
            </div>
            {isRegister && (
              <span className="text-[10px] text-gray-400 mt-0.5 block">Enterprise name is permanent and cannot be changed.</span>
            )}
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@company.com"
                  className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Email address cannot be changed after registration.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8B9A6E] hover:bg-sage-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-md mt-2"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Enterprise & Login' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#8B9A6E] hover:underline font-medium"
          >
            {isRegister ? 'Already registered? Login' : "Don't have an enterprise account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
