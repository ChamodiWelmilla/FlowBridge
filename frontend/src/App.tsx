import React, { useState } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { DocumentForm } from './components/DocumentForm';
import { LifecycleTracker } from './components/LifecycleTracker';
import { DLQPanel } from './components/DLQPanel';
import { authApi } from './api/client';
import { FileText, Activity, AlertOctagon, ShieldCheck, Lock, User, Network, Mail, Building2 } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(authApi.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingestion' | 'tracker' | 'dlq'>('ingestion');
  const [trackedDocId, setTrackedDocId] = useState<string>('');

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDocumentSubmitted = (docId: string) => {
    setTrackedDocId(docId);
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  const handleInitialAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await authApi.register(username, email, enterpriseName, password);
        const res = await authApi.login(username, password);
        setUser(res.username);
      } else {
        const res = await authApi.login(username, password);
        setUser(res.username);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-sage-50 text-gray-800 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-sage-200 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex bg-sage-100 text-[#8B9A6E] p-4 rounded-2xl border border-sage-200 mb-2">
              <Network className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">FlowBridge Enterprise</h1>
            <p className="text-xs text-gray-500">B2B Document Processing &amp; Integration Platform</p>
          </div>

          <div className="bg-sage-50/50 border border-sage-200 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-[#8B9A6E]" />
              <h2 className="text-sm font-bold text-gray-900">
                {isRegister ? 'Register Enterprise Account' : 'Welcome Back! Please Login'}
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleInitialAuthSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
                  />
                </div>
              </div>

              {isRegister && (
                <>
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
                        className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Email address cannot be changed after registration.</span>
                  </div>

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
                        className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Enterprise name is permanent and cannot be changed.</span>
                  </div>
                </>
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
                    className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8B9A6E] hover:bg-sage-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md mt-2"
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
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register Enterprise"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50/40 text-gray-800 font-sans flex flex-col">
      <Header
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(username) => setUser(username)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-sage-200 space-x-2 pb-1">
          <button
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'ingestion'
                ? 'bg-[#8B9A6E] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-sage-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Ingestion</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'tracker'
                ? 'bg-[#8B9A6E] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-sage-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>State Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('dlq')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'dlq'
                ? 'bg-[#8B9A6E] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-sage-100'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>DLQ Admin</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'ingestion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentForm onDocumentSubmitted={handleDocumentSubmitted} />
            <LifecycleTracker documentId={trackedDocId} />
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-4">
            <div className="bg-[#8B9A6E]/10 border border-sage-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
              <label className="text-xs font-semibold text-gray-700">Track Document ID:</label>
              <input
                type="text"
                placeholder="e.g. DOC-8F72A1"
                value={trackedDocId}
                onChange={(e) => setTrackedDocId(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#8B9A6E] font-mono"
              />
            </div>
            <LifecycleTracker documentId={trackedDocId} />
          </div>
        )}

        {activeTab === 'dlq' && <DLQPanel />}
      </main>

      <footer className="border-t border-sage-200 py-4 text-center text-xs text-gray-500 bg-white">
        FlowBridge Enterprise Integration Platform &copy; 2026
      </footer>
    </div>
  );
};

export default App;

