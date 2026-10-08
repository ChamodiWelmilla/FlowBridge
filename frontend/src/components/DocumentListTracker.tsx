import React, { useState } from 'react';
import { Search, Filter, RefreshCw, FileText, ArrowRight, CheckCircle2, AlertTriangle, Clock, Layers, ChevronRight, Eye } from 'lucide-react';
import { DocumentResponse, DocumentType } from '../types';
import { LifecycleTracker } from './LifecycleTracker';

interface DocumentListTrackerProps {
  documents: DocumentResponse[];
  selectedDocId: string;
  onSelectDocument: (docId: string) => void;
  onRefresh: () => void;
}

export const DocumentListTracker: React.FC<DocumentListTrackerProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredDocs = Array.isArray(documents)
    ? documents.filter((doc) => {
        const matchesType = filterType === 'ALL' || doc.documentType === filterType;
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          doc.documentId.toLowerCase().includes(query) ||
          (doc.reference && doc.reference.toLowerCase().includes(query)) ||
          doc.senderId.toLowerCase().includes(query) ||
          doc.receiverId.toLowerCase().includes(query) ||
          doc.status.toLowerCase().includes(query);
        return matchesType && matchesQuery;
      })
    : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'REVISION_ACCEPTED':
        return (
          <span className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>{status}</span>
          </span>
        );
      case 'DECLINED':
      case 'REVISION_REJECTED':
      case 'VALIDATION_FAILED':
      case 'DELIVERY_FAILED':
        return (
          <span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>{status}</span>
          </span>
        );
      case 'DELIVERED':
      case 'DELIVERING':
      case 'PROCESSING':
      case 'VALIDATED':
      case 'RECEIVED':
      case 'VALIDATING':
      case 'OPENED':
      default:
        return (
          <span className="bg-sage-100 text-sage-900 border border-sage-300 px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#8B9A6E]" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'INVOICE':
        return <span className="bg-sage-100 text-[#8B9A6E] font-semibold px-2.5 py-1 rounded-full text-xs border border-sage-200">INVOICE</span>;
      case 'ORDER':
        return <span className="bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full text-xs border border-amber-200">PURCHASE ORDER</span>;
      case 'CREDIT_NOTE':
        return <span className="bg-purple-100 text-purple-800 font-semibold px-2.5 py-1 rounded-full text-xs border border-purple-200">CREDIT NOTE</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-full text-xs border border-gray-200">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-sage-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-sage-100 text-[#8B9A6E] p-2.5 rounded-xl border border-sage-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Enterprise Document Directory</h2>
              <p className="text-xs text-gray-500">Select any document to inspect full state machine details &amp; audit history</p>
            </div>
          </div>

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="bg-sage-50 hover:bg-sage-100 text-[#8B9A6E] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border border-sage-200 transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-sage-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Document ID, Reference, Sender, Receiver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sage-50/40 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-[#8B9A6E] w-full sm:w-48"
            >
              <option value="ALL">All Document Types</option>
              <option value="INVOICE">Invoices</option>
              <option value="ORDER">Purchase Orders (PO)</option>
              <option value="CREDIT_NOTE">Credit Notes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-sage-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-sage-50/50 border-b border-sage-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Enterprise Documents ({filteredDocs.length})
          </span>
          <span className="text-xs text-gray-500">
            {selectedDocId ? (
              <span className="font-medium text-[#8B9A6E]">Selected: <strong className="font-mono font-bold">{selectedDocId}</strong></span>
            ) : (
              'Click a document row to view full details'
            )}
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-2">
            <FileText className="w-8 h-8 text-sage-300 mx-auto" />
            <p className="text-sm font-medium">No documents found matching your search criteria.</p>
            <p className="text-xs text-gray-400">Submit a new document from Document Ingestion or adjust filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50/80 text-gray-700 uppercase font-mono border-b border-sage-200">
                <tr>
                  <th className="p-3">Document ID / Ref</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sender ➔ Receiver</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {filteredDocs.map((doc) => {
                  const handleOpenInNewTab = () => {
                    const url = `${window.location.origin}${window.location.pathname}?docId=${encodeURIComponent(doc.documentId)}`;
                    window.open(url, '_blank');
                  };

                  return (
                    <tr
                      key={doc.documentId}
                      onClick={handleOpenInNewTab}
                      className="cursor-pointer transition-colors hover:bg-sage-50/70"
                    >
                      <td className="p-3 font-mono">
                        <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                          <span>{doc.documentId}</span>
                        </div>
                        {doc.reference && (
                          <div className="text-[11px] text-gray-500 font-sans">{doc.reference}</div>
                        )}
                      </td>

                      <td className="p-3">{getTypeBadge(doc.documentType)}</td>

                      <td className="p-3 font-medium text-gray-800">
                        <span>{doc.senderId}</span>
                        <span className="text-[#8B9A6E] font-bold mx-1">➔</span>
                        <span>{doc.receiverId}</span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-gray-900">
                        ${doc.amount ? doc.amount.toFixed(2) : '0.00'} <span className="text-[10px] text-gray-500 font-normal">{doc.currency || 'USD'}</span>
                      </td>

                      <td className="p-3 text-gray-600 font-mono text-[11px]">
                        {doc.issueDate || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-')}
                      </td>

                      <td className="p-3">{getStatusBadge(doc.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
