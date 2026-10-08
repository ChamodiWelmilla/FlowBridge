import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  History,
  PenTool,
  ShieldCheck,
  XCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Lock,
  AlertOctagon,
} from 'lucide-react';
import { DocumentStatusResponse, DocumentResponse, DocumentStatus } from '../types';
import { documentApi, authApi } from '../api/client';

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

const formatUserFriendlyErrorMessage = (rawReason?: string): string => {
  if (!rawReason || !rawReason.trim()) {
    return 'Document failed validation strategy or partner business rules.';
  }

  let cleaned = rawReason.replace(/^3-Way Matching Failure:\s*/i, '');
  cleaned = cleaned.replace(/^Over-Credit Protection Failure:\s*/i, '');

  if (cleaned.includes('No enum constant') || cleaned.includes("status is 'D'") || cleaned.includes("status is 'DECLINED'")) {
    return 'Referenced Purchase Order is Declined or Closed and cannot accept new billing.';
  }

  cleaned = cleaned.replace(/status is 'D'/g, "is Declined or Closed");
  cleaned = cleaned.replace(/status is 'DECLINED'/g, "is Declined or Closed");
  cleaned = cleaned.replace(/'D' \(Declined or Closed\)/g, "Declined or Closed");

  if (cleaned.includes('com.flowbridge') || cleaned.includes('NullPointerException')) {
    return 'Referenced Purchase Order is Declined or Closed and cannot accept new billing.';
  }

  return cleaned;
};

export const LifecycleTracker: React.FC<LifecycleTrackerProps> = ({ documentId }) => {
  const currentEnterprise = authApi.getEnterpriseName();
  const openedDocsRef = useRef<Set<string>>(new Set());

  const [data, setData] = useState<DocumentStatusResponse | null>(null);
  const [docDetails, setDocDetails] = useState<DocumentResponse | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeAction, setActiveAction] = useState<
    'ACCEPT' | 'DECLINE' | 'REQUEST_CHANGE' | 'ACCEPT_REVISION' | 'COUNTER_REVISION' | 'REJECT_REVISION' | null
  >(null);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('');
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchStatus = async (isSilent = false) => {
    if (!documentId) return;
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const [statusRes, detailsRes] = await Promise.all([
        documentApi.getDocumentStatus(documentId),
        documentApi.getDocumentById(documentId).catch(() => null),
      ]);
      setData(statusRes);
      if (detailsRes) {
        setDocDetails(detailsRes);
        if (
          detailsRes.status === 'DELIVERED' &&
          detailsRes.receiverId.toLowerCase() === currentEnterprise.toLowerCase() &&
          !openedDocsRef.current.has(documentId)
        ) {
          openedDocsRef.current.add(documentId);
          documentApi.performDocumentAction(documentId, { action: 'OPEN' }).catch(() => {});
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(`🔒 Access Denied: Document ${documentId} does not belong to your enterprise.`);
      } else {
        setError(err.response?.data?.message || 'Could not fetch document status');
      }
      setData(null);
      setDocDetails(null);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const triggerSyncBroadcast = (docId: string) => {
    try {
      const bc = new BroadcastChannel('flowbridge_doc_sync_channel');
      bc.postMessage({ type: 'DOCUMENT_UPDATED', documentId: docId });
      bc.close();
    } catch (e) {}
    try {
      localStorage.setItem('flowbridge_sync_event', `${docId}:${Date.now()}`);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('flowbridge_doc_updated', { detail: { documentId: docId } }));
  };

  useEffect(() => {
    fetchStatus(false);

    const interval = setInterval(() => {
      const status = docDetails?.status || data?.status;
      const terminalStatuses = ['ACCEPTED', 'DECLINED', 'VALIDATION_FAILED', 'DELIVERY_FAILED'];
      const isTerminal = status && terminalStatuses.includes(status);
      if (!isTerminal) {
        fetchStatus(true);
      }
    }, 2000);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('flowbridge_doc_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.documentId === documentId) {
          fetchStatus(true);
        }
      };
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'flowbridge_sync_event' && e.newValue?.startsWith(documentId)) {
        fetchStatus(true);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail?.documentId === documentId) {
        fetchStatus(true);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('flowbridge_doc_updated', handleCustomEvent);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('flowbridge_doc_updated', handleCustomEvent);
    };
  }, [documentId, docDetails?.status, data?.status]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction || !documentId) return;

    setActionLoading(true);
    setActionError('');

    try {
      const updated = await documentApi.performDocumentAction(documentId, {
        action: activeAction,
        comments,
        signerName: signerName.trim() || currentEnterprise,
        signerRole: signerRole.trim() || 'Authorized Representative',
      });
      setDocDetails(updated);
      setActiveAction(null);
      setComments('');
      setSignerName('');
      setSignerRole('');
      fetchStatus(true);
      triggerSyncBroadcast(documentId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to record document decision');
    } finally {
      setActionLoading(false);
    }
  };

  if (!documentId) {
    return (
      <div className="bg-white border border-sage-200 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
        <Activity className="w-8 h-8 text-sage-400 mx-auto mb-3" />
        <p className="text-sm font-medium">Submit a document or select one from the directory to track lifecycle status</p>
      </div>
    );
  }

  const currentStatus = docDetails?.status || data?.status;
  const isFailed = currentStatus === 'VALIDATION_FAILED' || currentStatus === 'DELIVERY_FAILED';

  const isSender = Boolean(docDetails && currentEnterprise && docDetails.senderId.toLowerCase() === currentEnterprise.toLowerCase());
  const isReceiver = Boolean(docDetails && currentEnterprise && docDetails.receiverId.toLowerCase() === currentEnterprise.toLowerCase());

  const isChangeRequested = currentStatus === 'CHANGE_REQUESTED';
  const isDeclined = currentStatus === 'DECLINED' || currentStatus === 'REVISION_REJECTED';

  const lastRequester = docDetails?.requestedBy;
  const isPartyWhoMadeChange = Boolean(
    isChangeRequested &&
    lastRequester &&
    currentEnterprise &&
    lastRequester.toLowerCase() === currentEnterprise.toLowerCase()
  );

  const canSenderAct = isSender && !isDeclined && (isChangeRequested || currentStatus === 'DELIVERED' || currentStatus === 'OPENED');
  const canReceiverAct = isReceiver && !isDeclined && (['DELIVERED', 'OPENED', 'CHANGE_REQUESTED'].includes(currentStatus || ''));

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
          onClick={() => fetchStatus(false)}
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

      {/* State machine failure diagnostic card */}
      {(isFailed || docDetails?.failureReason || data?.failureReason) && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 text-red-700 p-2.5 rounded-xl border border-red-200 shrink-0">
              <AlertOctagon className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-extrabold text-red-900 flex items-center gap-2">
                  <span>Document Validation Failure</span>
                  <span className="bg-red-200 text-red-900 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                    {currentStatus || 'VALIDATION_FAILED'}
                  </span>
                </h3>
                <span className="text-[11px] text-red-700 font-mono font-semibold">
                  Sender ({docDetails?.senderId || 'Sender'}) &amp; Receiver ({docDetails?.receiverId || 'Receiver'})
                </span>
              </div>
              <p className="text-xs text-red-800">
                This document failed enterprise business rule validation during system processing.
              </p>
            </div>
          </div>

          <div className="bg-white border border-red-200 rounded-xl p-3.5 text-xs text-red-900 space-y-1.5 shadow-2xs">
            <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Validation Error Details:
            </span>
            <p className="font-semibold text-xs leading-relaxed text-red-950 bg-red-50/50 p-2 rounded-lg border border-red-100">
              {formatUserFriendlyErrorMessage(docDetails?.failureReason || data?.failureReason)}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-red-700 pt-1 border-t border-red-200/60">
            <span className="flex items-center space-x-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span><strong>Next Step:</strong> Review referenced Purchase Order / Invoice status and resubmit with valid details.</span>
            </span>
            <span className="font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              Action Required
            </span>
          </div>
        </div>
      )}

      {/* Recipient digital signature */}
      {docDetails?.status === 'ACCEPTED' && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-700 p-2.5 rounded-xl border border-green-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-green-900 flex items-center gap-2">
                  <span>Digitally Signed &amp; Accepted by Recipient</span>
                  <span className="bg-green-200 text-green-900 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">Official Seal</span>
                </h3>
                <p className="text-xs text-green-800">
                  Recipient enterprise <strong className="font-bold">{docDetails.receiverId}</strong> has verified and signed this document.
                </p>
              </div>
            </div>
            {docDetails.signatureData && (
              <span className="text-xs font-mono bg-white text-green-800 border border-green-200 px-2.5 py-1 rounded-lg font-bold">
                {docDetails.signatureData}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white/80 p-3 rounded-xl border border-green-200">
            <div>
              <span className="text-xs text-gray-500 block font-semibold">Signer Name &amp; Title</span>
              <span className="font-bold text-gray-900">{docDetails.signedBy || docDetails.receiverId}</span>
              {docDetails.signerRole && <span className="text-gray-500 block text-xs font-medium">{docDetails.signerRole}</span>}
            </div>
            <div>
              <span className="text-xs text-gray-500 block font-semibold">Signature Timestamp</span>
              <span className="font-mono text-gray-900 font-semibold">
                {docDetails.actionTimestamp ? new Date(docDetails.actionTimestamp).toLocaleString() : '-'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block font-semibold">Recipient Notes</span>
              <span className="text-gray-800 italic">{docDetails.actionComments || 'No acceptance comments provided.'}</span>
            </div>
          </div>
        </div>
      )}

      {isDeclined && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 text-red-700 p-2.5 rounded-xl border border-red-300">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-red-900 flex items-center gap-2">
                <span>Document Status: DECLINED (Workflow Permanently Closed)</span>
                <span className="bg-red-200 text-red-900 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">Final State</span>
              </h3>
              <p className="text-xs text-red-800">
                This document has been declined. Customer has viewed the posted change request and marked the document as declined. No further modifications or actions are allowed.
              </p>
            </div>
          </div>
          {docDetails?.actionComments && (
            <div className="bg-white/80 border border-red-200 p-3 rounded-xl text-xs text-red-900">
              <strong>Decline Reason / Notes:</strong> {docDetails.actionComments}
            </div>
          )}
        </div>
      )}

      {isChangeRequested && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl border border-amber-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-900">
                {isPartyWhoMadeChange
                  ? 'Your Change Request is Active (Awaiting Response)'
                  : 'Incoming Change Request Active'}
              </h3>
              <p className="text-xs text-amber-800">
                {isPartyWhoMadeChange
                  ? `You (${lastRequester}) posted a change request. You cannot accept your own request or make another change request while waiting. Only Decline is available.`
                  : `${lastRequester || 'The other party'} requested a change for this document. You can Accept the changes, Request a Counter Revision, or Decline.`}
              </p>
            </div>
          </div>
          {docDetails?.actionComments && (
            <div className="bg-white/80 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
              <strong>Posted Change Details (by {lastRequester || 'Party'}):</strong> {docDetails.actionComments}
            </div>
          )}
        </div>
      )}

      {/* Sender negotiation action panel */}
      {canSenderAct && (
        <div className="bg-gradient-to-r from-amber-100/70 to-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-700 text-white p-2 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Sender Actions ({currentEnterprise})</h3>
                <p className="text-xs text-gray-600">
                  {isPartyWhoMadeChange
                    ? 'You requested changes. You cannot accept or post another change request until the receiver responds. Only Decline is available.'
                    : 'The receiver requested changes. You can accept the revisions, submit a counter proposal, or decline.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isPartyWhoMadeChange}
                onClick={() => !isPartyWhoMadeChange && setActiveAction('ACCEPT_REVISION')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 ${
                  isPartyWhoMadeChange
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-60'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={isPartyWhoMadeChange ? 'Cannot accept your own change request' : 'Accept Revision Terms'}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isPartyWhoMadeChange ? 'Accept (Disabled)' : 'Accept Revision Terms'}</span>
              </button>

              <button
                type="button"
                disabled={isPartyWhoMadeChange}
                onClick={() => !isPartyWhoMadeChange && setActiveAction('COUNTER_REVISION')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 ${
                  isPartyWhoMadeChange
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-60'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                title={isPartyWhoMadeChange ? 'Cannot submit consecutive change requests' : 'Submit Counter Proposal'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isPartyWhoMadeChange ? 'Counter (Disabled)' : 'Submit Counter Proposal'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('REJECT_REVISION')}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline Revisions</span>
              </button>
            </div>
          </div>

          {/* Sender decision drawer */}
          {activeAction && ['ACCEPT_REVISION', 'COUNTER_REVISION', 'REJECT_REVISION'].includes(activeAction) && (
            <form onSubmit={handleExecuteAction} className="bg-white border border-amber-300 rounded-xl p-4 space-y-4 text-xs mt-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="font-bold text-gray-900 uppercase">
                  {activeAction === 'ACCEPT_REVISION' && '🤝 Accept Recipient Revision Terms'}
                  {activeAction === 'COUNTER_REVISION' && '🔄 Submit Counter Proposal / Revised Document Notes'}
                  {activeAction === 'REJECT_REVISION' && '❌ Decline Recipient Revision Request'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {activeAction === 'ACCEPT_REVISION' && 'Sender Notes / Confirmation details (Optional)'}
                  {activeAction === 'COUNTER_REVISION' && 'Specify Counter Terms / Revised Specifications (Required)'}
                  {activeAction === 'REJECT_REVISION' && 'Reason for Declining Revisions (Required)'}
                </label>
                <textarea
                  rows={2}
                  required={activeAction !== 'ACCEPT_REVISION'}
                  placeholder={
                    activeAction === 'ACCEPT_REVISION'
                      ? 'e.g. Agreed to updated delivery window of Oct 25th.'
                      : activeAction === 'COUNTER_REVISION'
                      ? 'e.g. Can adjust price to $475/unit instead of requested $450.'
                      : 'e.g. Cannot modify line item pricing due to standard contractual terms.'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-amber-50/30 border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm ${
                    activeAction === 'ACCEPT_REVISION'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : activeAction === 'COUNTER_REVISION'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {actionLoading ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Receiver action panel */}
      {canReceiverAct && (
        <div className="bg-gradient-to-r from-sage-100/70 to-sage-50 border-2 border-sage-300 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-[#8B9A6E] text-white p-2 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Receiver Actions ({currentEnterprise})</h3>
                <p className="text-xs text-gray-600">
                  {isPartyWhoMadeChange
                    ? 'You requested changes. Accept & Counter options are disabled until the sender responds — only Decline is allowed.'
                    : 'Review this document and submit your signature, revision request, or rejection.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isPartyWhoMadeChange}
                onClick={() => !isPartyWhoMadeChange && setActiveAction('ACCEPT')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 ${
                  isPartyWhoMadeChange
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-60'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title={isPartyWhoMadeChange ? 'Cannot accept your own change request' : 'Accept & Sign Document'}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{isPartyWhoMadeChange ? 'Accept (Disabled)' : 'Accept & Sign'}</span>
              </button>

              <button
                type="button"
                disabled={isPartyWhoMadeChange}
                onClick={() => !isPartyWhoMadeChange && setActiveAction('REQUEST_CHANGE')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 ${
                  isPartyWhoMadeChange
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-60'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                title={isPartyWhoMadeChange ? 'Cannot submit consecutive change requests' : 'Request Revisions'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isPartyWhoMadeChange ? 'Counter (Disabled)' : 'Request Revisions'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('DECLINE')}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline Document</span>
              </button>
            </div>
          </div>

          {activeAction && ['ACCEPT', 'REQUEST_CHANGE', 'DECLINE'].includes(activeAction) && (
            <form onSubmit={handleExecuteAction} className="bg-white border border-sage-300 rounded-xl p-4 space-y-4 text-xs mt-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-sage-100 pb-2">
                <span className="font-bold text-gray-900 uppercase">
                  {activeAction === 'ACCEPT' && '✍️ Accept & Digital Signature Authorization'}
                  {activeAction === 'REQUEST_CHANGE' && '📝 Request Document Revisions'}
                  {activeAction === 'DECLINE' && '🚫 Decline Document'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg">
                  {actionError}
                </div>
              )}

              {activeAction === 'ACCEPT' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Authorized Signer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Title / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. VP Procurement or CFO"
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value)}
                      className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {activeAction === 'ACCEPT' && 'Acceptance Comments / Payment Confirmation (Optional)'}
                  {activeAction === 'REQUEST_CHANGE' && 'Specify Required Changes / Revisions (Required)'}
                  {activeAction === 'DECLINE' && 'Reason for Declining (Required)'}
                </label>
                <textarea
                  rows={2}
                  required={activeAction !== 'ACCEPT'}
                  placeholder={
                    activeAction === 'ACCEPT'
                      ? 'e.g. Approved and signed for accounts payable.'
                      : activeAction === 'REQUEST_CHANGE'
                      ? 'e.g. Please update delivery window to Oct 25th.'
                      : 'e.g. Declining change request.'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm ${
                    activeAction === 'ACCEPT'
                      ? 'bg-green-600 hover:bg-green-700'
                      : activeAction === 'REQUEST_CHANGE'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? 'Recording Decision...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Document content details card */}
      {docDetails && (
        <div className="bg-sage-50/70 border border-sage-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-sage-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#8B9A6E]" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Full Document Payload &amp; Line Item Inspection
              </h3>
            </div>
            <span className="text-[11px] font-mono text-gray-500">
              Version: <strong className="text-gray-900 font-bold">v{docDetails.version || 1}</strong>
            </span>
          </div>

          {/* Core metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Document ID</span>
              <span className="font-mono font-bold text-gray-900 text-sm">{docDetails.documentId}</span>
            </div>
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Reference</span>
              <span className="font-mono font-bold text-[#8B9A6E] text-sm">{docDetails.reference || '-'}</span>
            </div>
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Document Type</span>
              <span className="font-mono font-bold text-gray-900">{docDetails.documentType}</span>
            </div>
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Currency</span>
              <span className="font-mono font-bold text-gray-900">{docDetails.currency || 'USD'}</span>
            </div>

            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Sender Enterprise</span>
              <span className="font-semibold text-gray-900 block">{docDetails.senderId}</span>
              {docDetails.senderTaxId && (
                <span className="text-[10px] text-gray-500 font-mono">Tax ID: {docDetails.senderTaxId}</span>
              )}
            </div>
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Receiver Enterprise</span>
              <span className="font-semibold text-gray-900 block">{docDetails.receiverId}</span>
              {docDetails.recipientTaxId && (
                <span className="text-[10px] text-gray-500 font-mono">Tax ID: {docDetails.recipientTaxId}</span>
              )}
            </div>
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Issue Date</span>
              <span className="font-mono text-gray-900 font-semibold">
                {docDetails.issueDate || (docDetails.createdAt ? new Date(docDetails.createdAt).toISOString().split('T')[0] : '-')}
              </span>
            </div>
            <div className="bg-white border border-sage-200 p-3 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 block font-semibold uppercase">Due Date / Window</span>
              <span className="font-mono text-gray-900 font-semibold">
                {docDetails.dueDate || docDetails.deliveryWindow || (docDetails.paymentTerms ? docDetails.paymentTerms : 'Due on Receipt')}
              </span>
            </div>
          </div>

          {/* Document specific metadata */}
          <div className="bg-white border border-sage-200 rounded-xl p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              {docDetails.documentType} Document-Specific Attributes
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {docDetails.paymentTerms && (
                <span className="bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-lg text-gray-700">
                  Payment Terms: <strong className="text-gray-900">{docDetails.paymentTerms}</strong>
                </span>
              )}
              {docDetails.paymentStatus && (
                <span className="bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-lg text-gray-700">
                  Payment Status: <strong className="text-gray-900">{docDetails.paymentStatus}</strong>
                </span>
              )}
              {docDetails.acceptedPaymentMethods && (
                <span className="bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-lg text-gray-700">
                  Accepted Methods: <strong className="text-gray-900">{docDetails.acceptedPaymentMethods}</strong>
                </span>
              )}
              {docDetails.poReference && (
                <span className="bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-lg text-gray-700">
                  Linked PO Ref: <strong className="text-gray-900">{docDetails.poReference}</strong>
                </span>
              )}
              {docDetails.deliveryWindow && (
                <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900">
                  Delivery Window: <strong>{docDetails.deliveryWindow}</strong>
                </span>
              )}
              {docDetails.shippingMethod && (
                <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900">
                  Carrier: <strong>{docDetails.shippingMethod}</strong>
                </span>
              )}
              {docDetails.requestedBy && (
                <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900">
                  Requested By: <strong>{docDetails.requestedBy}</strong>
                </span>
              )}
              {docDetails.approvalStatus && (
                <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900">
                  Approval: <strong>{docDetails.approvalStatus}</strong>
                </span>
              )}
              {docDetails.originalInvoiceReference && (
                <span className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-900">
                  Original Invoice: <strong>{docDetails.originalInvoiceReference}</strong>
                </span>
              )}
              {docDetails.reasonCode && (
                <span className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-900">
                  Reason: <strong>{docDetails.reasonCode}</strong>
                </span>
              )}
              {docDetails.refundImpact && (
                <span className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-900">
                  Impact: <strong>{docDetails.refundImpact}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Line item display */}
          {Array.isArray(docDetails.items) && docDetails.items.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                Line Item Details ({docDetails.items.length})
              </span>
              <div className="overflow-x-auto border border-sage-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sage-50 text-sage-900 uppercase font-mono border-b border-sage-200">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Tax %</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100 font-mono">
                    {docDetails.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-sage-50/40">
                        <td className="p-2.5 font-sans font-bold text-gray-900">{item.itemName}</td>
                        <td className="p-2.5 text-gray-600 font-mono">{item.itemSku || '-'}</td>
                        <td className="p-2.5 font-sans text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                        <td className="p-2.5 text-right font-semibold">{item.quantity}</td>
                        <td className="p-2.5 text-right">${(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right">{item.taxRate || 0}%</td>
                        <td className="p-2.5 text-right font-bold text-gray-900">${(item.lineTotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(() => {
            const calculatedSubtotal = (docDetails.subtotal && docDetails.subtotal > 0)
              ? docDetails.subtotal
              : (docDetails.items || []).reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);

            const calculatedTax = (docDetails.taxAmount && docDetails.taxAmount > 0)
              ? docDetails.taxAmount
              : (docDetails.items || []).reduce((acc, i) => acc + (((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) * (Number(i.taxRate) || 0)) / 100), 0);

            const calculatedDiscount = docDetails.discount || 0;

            const calculatedGrandTotal = (docDetails.amount && docDetails.amount > 0)
              ? docDetails.amount
              : Math.max(0, calculatedSubtotal + calculatedTax - calculatedDiscount);

            return (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-4 pt-2">
                <div className="w-full md:w-1/2 bg-white border border-sage-200 rounded-xl p-3.5 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Notes &amp; Payment Memos
                  </span>
                  <p className="text-gray-700 italic font-sans">
                    {docDetails.notes || 'No terms or internal memos recorded.'}
                  </p>
                </div>

                <div className="w-full md:w-72 bg-white border border-sage-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block pb-1 border-b border-sage-100">
                    Financial Summary Breakdown
                  </span>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">${calculatedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax Amount:</span>
                    <span className="font-mono font-semibold">${calculatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-${calculatedDiscount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-sage-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#8B9A6E]">${calculatedGrandTotal.toFixed(2)} {docDetails.currency || 'USD'}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="bg-sage-50/50 border border-sage-200 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px] space-x-2">
          {STAGES.concat(
            currentStatus === 'ACCEPTED' ? ['ACCEPTED'] :
            currentStatus === 'DECLINED' ? ['DECLINED'] :
            currentStatus === 'CHANGE_REQUESTED' ? ['CHANGE_REQUESTED'] :
            currentStatus === 'REVISION_ACCEPTED' ? ['REVISION_ACCEPTED'] :
            currentStatus === 'REVISION_REJECTED' ? ['REVISION_REJECTED'] : []
          ).map((stage, idx, arr) => {
            const isCurrent = currentStatus === stage;
            const isCompleted = Boolean(data?.history?.some((e) => e.newStatus === stage));

            let statusBg = 'bg-white text-gray-500 border-gray-200';
            if (isCurrent) {
              if (stage === 'ACCEPTED' || stage === 'REVISION_ACCEPTED') statusBg = 'bg-green-600 text-white border-green-600 shadow-md scale-105 font-bold';
              else if (stage === 'DECLINED' || stage === 'REVISION_REJECTED' || stage === 'VALIDATION_FAILED' || stage === 'DELIVERY_FAILED') statusBg = 'bg-red-600 text-white border-red-600 shadow-md scale-105 font-bold';
              else if (stage === 'CHANGE_REQUESTED') statusBg = 'bg-amber-600 text-white border-amber-600 shadow-md scale-105 font-bold';
              else statusBg = 'bg-[#8B9A6E] text-white border-[#8B9A6E] shadow-md scale-105 font-bold';
            } else if (isCompleted) {
              statusBg = 'bg-sage-100 text-sage-900 border-sage-300 font-semibold';
            }

            return (
              <React.Fragment key={stage}>
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${statusBg}`}>
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="w-4 h-4 mb-1 text-[#8B9A6E]" />
                  ) : (
                    <Clock className="w-4 h-4 mb-1" />
                  )}
                  <span>{stage}</span>
                </div>
                {idx < arr.length - 1 && (
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

      {/* Audit history */}
      {data && Array.isArray(data.history) && data.history.length > 0 && (
        <div className="bg-white border border-sage-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="w-full p-4 flex items-center justify-between hover:bg-sage-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#8B9A6E]" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Audit Event Trail ({data.history.length} Events Recorded)
              </h3>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-[#8B9A6E] font-bold bg-sage-100 hover:bg-sage-200 px-3 py-1 rounded-lg border border-sage-200 transition-all">
              <span>{showAuditTrail ? 'Hide Audit Log' : 'View Audit Event Trail'}</span>
              {showAuditTrail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAuditTrail && (
            <div className="p-4 pt-0 border-t border-sage-100 space-y-2 mt-3">
              {data.history.map((evt, index) => (
                <div
                  key={index}
                  className="bg-sage-50/50 border border-sage-200 rounded-xl p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono bg-sage-100 text-sage-900 border border-sage-300 px-2 py-0.5 rounded font-semibold">
                        {evt.eventType}
                      </span>
                      <span className="text-gray-700 font-medium">
                        {evt.previousStatus || 'INIT'} ➔ <strong className="text-gray-900">{evt.newStatus}</strong>
                      </span>
                    </div>
                    <span className="text-gray-500 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {evt.payload && (
                    <div className="text-[11px] text-gray-600 font-mono bg-white p-2 rounded border border-sage-200">
                      {evt.payload}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
