import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, Lock, Building2 } from 'lucide-react';
import { DocumentSubmitRequest, DocumentType } from '../types';
import { documentApi, authApi } from '../api/client';

interface DocumentFormProps {
  onDocumentSubmitted: (docId: string) => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ onDocumentSubmitted }) => {
  const currentEnterprise = authApi.getEnterpriseName() || 'Sender Enterprise';
  
  const [documentType, setDocumentType] = useState<DocumentType>('INVOICE');
  const [receiverId, setReceiverId] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResponse, setSuccessResponse] = useState<{ documentId: string; status: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessResponse(null);
    setLoading(true);

    const payload: DocumentSubmitRequest = {
      documentType,
      senderId: currentEnterprise,
      receiverId,
      reference,
      amount: parseFloat(amount),
    };

    try {
      const res = await documentApi.submitDocument(payload);
      setSuccessResponse(res);
      onDocumentSubmitted(res.documentId);
      setReceiverId('');
      setReference('');
      setAmount('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-sage-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-sage-100">
        <div className="flex items-center space-x-3">
          <div className="bg-sage-100 text-[#8B9A6E] p-2.5 rounded-xl border border-sage-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Document Ingestion Gateway</h2>
            <p className="text-xs text-gray-500">Submit electronic transaction for async processing</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl mb-4">
          {error}
        </div>
      )}

      {successResponse && (
        <div className="bg-sage-50 border border-sage-300 text-sage-900 text-xs p-4 rounded-xl mb-6 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-[#8B9A6E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-sage-900 mb-1">HTTP 202 Accepted</h4>
            <p className="mb-2 text-sage-800">{successResponse.message}</p>
            <div className="flex items-center space-x-4 text-xs font-mono text-sage-900">
              <span>Document ID: <strong className="text-[#8B9A6E] font-bold">{successResponse.documentId}</strong></span>
              <span>Status: <strong className="text-gray-900 font-bold">{successResponse.status}</strong></span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#8B9A6E]"
            >
              <option value="INVOICE">INVOICE</option>
              <option value="ORDER">PURCHASE ORDER</option>
              <option value="CREDIT_NOTE">CREDIT NOTE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-2026-00123"
              className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">Sender Enterprise (Your Enterprise)</label>
              <span className="text-[10px] text-[#8B9A6E] bg-sage-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Auto
              </span>
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                disabled
                readOnly
                value={currentEnterprise}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-700 font-semibold cursor-not-allowed select-none opacity-85"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Receiver Enterprise Name (Destination)</label>
            <input
              type="text"
              required
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="e.g. Apple Inc. or TSMC"
              className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Total Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 125000.00"
              className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8B9A6E] hover:bg-sage-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2 mt-4"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Submitting to Queue...' : 'Submit Document'}</span>
        </button>
      </form>
    </div>
  );
};
