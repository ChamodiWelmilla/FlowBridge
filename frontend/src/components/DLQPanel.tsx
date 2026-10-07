import React, { useEffect, useState } from 'react';
import { AlertOctagon, RotateCcw, RefreshCw } from 'lucide-react';
import { DLQDocument } from '../types';
import { dlqApi } from '../api/client';

export const DLQPanel: React.FC = () => {
  const [documents, setDocuments] = useState<DLQDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchDLQ = async () => {
    setLoading(true);
    try {
      const data = await dlqApi.getDeadLetterDocuments();
      setDocuments(data);
    } catch (err: any) {
      console.error('Failed to load DLQ documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQ();
  }, []);

  const handleReprocess = async (docId: string) => {
    setReprocessingId(docId);
    setMessage('');
    try {
      const res = await dlqApi.reprocessDocument(docId);
      setMessage(res.message);
      fetchDLQ();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Reprocessing failed');
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="bg-white border border-sage-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-sage-100">
        <div className="flex items-center space-x-3">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-200">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dead Letter Queue (DLQ) Admin</h2>
            <p className="text-xs text-gray-500">Quarantined failed documents requiring administrative action</p>
          </div>
        </div>

        <button
          onClick={fetchDLQ}
          disabled={loading}
          className="bg-sage-50 hover:bg-sage-100 text-sage-800 p-2 rounded-lg transition-colors border border-sage-200"
          title="Refresh DLQ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <div className="bg-sage-100 border border-sage-300 text-sage-900 text-xs p-3.5 rounded-xl font-medium">
          {message}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-sage-50/50 border border-sage-200 rounded-xl p-8 text-center text-gray-500">
          <p className="text-sm font-medium text-sage-800">No dead-lettered documents found. System is healthy!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sage-50 text-sage-900 uppercase font-mono border-b border-sage-200">
              <tr>
                <th className="p-3">Doc ID</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Type</th>
                <th className="p-3">Sender ➔ Receiver</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 text-gray-700">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-sage-50/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#8B9A6E]">{doc.id}</td>
                  <td className="p-3">{doc.externalReference}</td>
                  <td className="p-3">{doc.documentType}</td>
                  <td className="p-3 font-mono text-gray-500">{doc.senderId} ➔ {doc.receiverId}</td>
                  <td className="p-3 font-semibold text-gray-900">${doc.amount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-mono font-semibold">
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleReprocess(doc.id)}
                      disabled={reprocessingId === doc.id}
                      className="bg-[#8B9A6E] hover:bg-sage-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1.5 shadow-sm"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${reprocessingId === doc.id ? 'animate-spin' : ''}`} />
                      <span>{reprocessingId === doc.id ? 'Reprocessing...' : 'Reprocess'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
