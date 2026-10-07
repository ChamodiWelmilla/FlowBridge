import React from 'react';
import { Network, ShieldCheck, UserCheck, LogOut, Settings } from 'lucide-react';
import { authApi } from '../api/client';

interface HeaderProps {
  user: string | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onOpenProfile, onLogout }) => {
  const enterpriseName = authApi.getEnterpriseName();

  return (
    <header className="bg-white border-b border-sage-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="bg-[#8B9A6E] p-2.5 rounded-xl text-white shadow-sm">
          <Network className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-wide flex items-center gap-2">
            FlowBridge
          </h1>
          <p className="text-xs text-gray-500">Document Processing &amp; Integration Platform</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">        
        {user ? (
          <div className="flex items-center space-x-3 bg-sage-50 border border-sage-200 px-3 py-1.5 rounded-lg">
            <UserCheck className="w-4 h-4 text-[#8B9A6E]" />
            <div className="flex flex-col text-left cursor-pointer" onClick={onOpenProfile} title="Profile & Account Settings">
              <span className="text-xs font-bold text-gray-800 leading-tight">{user}</span>
              {enterpriseName && (
                <span className="text-[10px] text-[#8B9A6E] font-semibold leading-tight">{enterpriseName}</span>
              )}
            </div>
            <button
              onClick={onOpenProfile}
              className="text-gray-400 hover:text-[#8B9A6E] transition-colors p-1"
              title="Profile & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 border-l border-gray-200 pl-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-2 bg-[#8B9A6E] hover:bg-sage-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Login / Register</span>
          </button>
        )}
      </div>
    </header>
  );
};
