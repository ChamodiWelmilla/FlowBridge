import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { DocumentStatusResponse, DocumentStatus } from '../types';
import { documentApi } from '../api/client';

interface LifecycleTrackerProps {
  documentId: string;
}

const STAGES: DocumentStatus[] = [
  'RECEIVED',
  'VALIDATING',
  'VALIDATED',
  'PROCESSING',
  'DELIVERING',
  'DELIVERED',
];

export const LifecycleTracker: React.FC<LifecycleTrackerProps> = ({ documentId }) => {
  const [data, setData] = useState<DocumentStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    if (!documentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await documentApi.getDocumentStatus(documentId);
      setData(res);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(`🔒 Access Denied: Document ${documentId} does not belong to your enterprise.`);
      } else {
        setError(err.response?.data?.message || 'Could not fetch document status');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [documentId]);

  if (!documentId) {
    return (
      <div className="bg-white border border-sage-200 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
        <Activity className="w-8 h-8 text-sage-400 mx-auto mb-3" />
        <p className="text-sm font-medium">Submit a document or enter a Document ID to track lifecycle status</p>
      </div>
    );
  }

  const currentStatus = data?.status;
  const isFailed = currentStatus === 'VALIDATION_FAILED' || currentStatus === 'DELIVERY_FAILED';

  return (
    <div className="bg-white border border-sage-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-sage-100">
        <div className="flex items-center space-x-3">
          <div className="bg-sage-100 text-[#8B9A6E] p-2.5 rounded-xl border border-sage-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Live State Machine Tracker</h2>
            <p className="text-xs text-gray-500">Real-time lifecycle graph for <span className="font-mono text-[#8B9A6E] font-bold">{documentId}</span></p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="bg-sage-50 hover:bg-sage-100 text-sage-800 p-2 rounded-lg transition-colors border border-sage-200"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* State Machine Transition Graph */}
      <div className="bg-sage-50/50 border border-sage-200 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] space-x-2">
          {STAGES.map((stage, idx) => {
            const isCurrent = currentStatus === stage;
            const isCompleted = Boolean(data?.history?.some((e) => e.newStatus === stage));

            let statusBg = 'bg-white text-gray-500 border-gray-200';
            if (isCurrent) {
              statusBg = 'bg-[#8B9A6E] text-white border-[#8B9A6E] shadow-md scale-105 font-bold';
            } else if (isCompleted) {
              statusBg = 'bg-sage-100 text-sage-900 border-sage-300 font-semibold';
            }

            return (
              <React.Fragment key={stage}>
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-mono transition-all ${statusBg}`}>
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="w-4 h-4 mb-1 text-[#8B9A6E]" />
                  ) : (
                    <Clock className="w-4 h-4 mb-1" />
                  )}
                  <span>{stage}</span>
                </div>
                {idx < STAGES.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-sage-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {isFailed && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center space-x-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>State Machine Halted: <strong>{currentStatus}</strong></span>
          </div>
        )}
      </div>

      {/* Audit Event History Timeline */}
      {data && Array.isArray(data.history) && data.history.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Audit Event Trail</h3>
          <div className="space-y-2">
            {data.history.map((evt, index) => (
              <div
                key={index}
                className="bg-sage-50/50 border border-sage-200 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono bg-sage-100 text-sage-900 border border-sage-300 px-2 py-0.5 rounded font-semibold">
                    {evt.eventType}
                  </span>
                  <span className="text-gray-700 font-medium">
                    {evt.previousStatus || 'INIT'} ➔ <strong className="text-gray-900">{evt.newStatus}</strong>
                  </span>
                </div>
                <span className="text-gray-400 font-mono">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
