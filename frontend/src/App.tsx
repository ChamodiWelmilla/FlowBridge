import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { DocumentForm } from './components/DocumentForm';
import { LifecycleTracker } from './components/LifecycleTracker';
import { DocumentListTracker } from './components/DocumentListTracker';
import { DLQPanel } from './components/DLQPanel';
import { authApi, documentApi } from './api/client';
import { DocumentResponse } from './types';
import { FileText, Activity, AlertOctagon, ShieldCheck, Lock, User, Network, Mail, Building2 } from 'lucide-react';

export const App: React.FC = () => {
  const getInitialUser = (): string | null => {
    const token = authApi.getToken();
    const enterprise = authApi.getEnterpriseName();
    if (!token || !enterprise) {
      authApi.logout();
      return null;
    }
    return enterprise;
  };

  const [user, setUser] = useState<string | null>(getInitialUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingestion' | 'tracker' | 'dlq'>('ingestion');
  const [trackedDocId, setTrackedDocId] = useState<string>('');
  const [myDocuments, setMyDocuments] = useState<DocumentResponse[]>([]);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail('');
    setEnterpriseName('');
    setPassword('');
    setError('');
  }, [isRegister, user]);

  const fetchMyDocuments = async () => {
    const token = authApi.getToken();
    if (!user || !token) {
      handleLogout();
      return;
    }
    try {
      const docs = await documentApi.getMyDocuments();
      if (Array.isArray(docs)) {
        setMyDocuments(docs);
        if (!trackedDocId && docs.length > 0) {
          setTrackedDocId(docs[0].documentId);
        }
      } else {
        setMyDocuments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch user documents', err);
      setMyDocuments([]);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMyDocuments();

    const interval = setInterval(() => {
      if (activeTab === 'tracker') {
        fetchMyDocuments();
      }
    }, 2500);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('flowbridge_doc_sync_channel');
      bc.onmessage = () => {
        fetchMyDocuments();
      };
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'flowbridge_sync_event') {
        fetchMyDocuments();
      }
    };

    const handleCustomEvent = () => {
      fetchMyDocuments();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('flowbridge_doc_updated', handleCustomEvent);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('flowbridge_doc_updated', handleCustomEvent);
    };
  }, [user, activeTab]);

  const handleDocumentSubmitted = (docId: string) => {
    setTrackedDocId(docId);
    fetchMyDocuments();
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setMyDocuments([]);
    setTrackedDocId('');
  };

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleInitialAuthSubmit = async (e: React.FormEvent) => {
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
        setUser(res.enterpriseName || enterpriseName.trim());
      } else {
        const res = await authApi.login(enterpriseName.trim(), password);
        setUser(res.enterpriseName || enterpriseName.trim());
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
                {isRegister ? 'Register Enterprise Account' : 'Welcome Back! Enterprise Login'}
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleInitialAuthSubmit} className="space-y-4" autoComplete="off">
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
                      className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] focus:ring-1 focus:ring-[#8B9A6E]"
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
                {isRegister ? 'Already registered? Login' : "Don't have an enterprise account? Register"}
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

        {activeTab === 'ingestion' && (
          <div className="max-w-4xl mx-auto">
            <DocumentForm
              onDocumentSubmitted={handleDocumentSubmitted}
              onViewTracker={() => setActiveTab('tracker')}
            />
          </div>
        )}

        {activeTab === 'tracker' && (
          <DocumentListTracker
            documents={myDocuments}
            selectedDocId={trackedDocId}
            onSelectDocument={(docId) => setTrackedDocId(docId)}
            onRefresh={fetchMyDocuments}
          />
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

