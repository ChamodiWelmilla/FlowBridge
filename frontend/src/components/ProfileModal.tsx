import React, { useState, useEffect } from 'react';
import { X, Lock, User, Mail, Building2, ShieldCheck, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../api/client';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setError('');
      setSuccess('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setFetching(true);
    try {
      const data = await authApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      setProfile({
        id: 'USER-LOCAL',
        username: authApi.getUser() || '',
        email: authApi.getEmail() || 'N/A',
        enterpriseName: authApi.getEnterpriseName() || 'N/A',
        role: 'ROLE_USER',
      });
    } finally {
      setFetching(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setSuccess(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-sage-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-sage-100 p-3 rounded-xl text-[#8B9A6E] border border-sage-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profile & Enterprise</h2>
            <p className="text-xs text-gray-500">Account settings and credentials management</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-lg mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Locked Profile Fields */}
        <div className="space-y-3 pb-5 border-b border-gray-100 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Account Details</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Immutable</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Enterprise Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled
                readOnly
                value={profile?.enterpriseName || 'Loading...'}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-700 font-medium cursor-not-allowed select-none opacity-80"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Enterprise name is permanently registered and cannot be altered.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled
                readOnly
                value={profile?.email || 'Loading...'}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-700 font-medium cursor-not-allowed select-none opacity-80"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Email address cannot be changed after account creation.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled
                readOnly
                value={profile?.username || 'Loading...'}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-700 font-medium cursor-not-allowed select-none opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            <KeyRound className="w-4 h-4 text-[#8B9A6E]" />
            <span>Change Password</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8B9A6E] hover:bg-sage-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-md mt-2"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
