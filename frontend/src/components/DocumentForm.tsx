import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, CheckCircle2, Lock, Building2, Plus, Trash2, Calendar, DollarSign, Tag, Info, ChevronDown, Search } from 'lucide-react';
import { DocumentSubmitRequest, DocumentType, DocumentItem } from '../types';
import { documentApi, authApi } from '../api/client';

interface DocumentFormProps {
  onDocumentSubmitted: (docId: string) => void;
  onViewTracker?: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ onDocumentSubmitted, onViewTracker }) => {
  const currentEnterprise = authApi.getEnterpriseName() || 'Sender Enterprise';

  const [documentType, setDocumentType] = useState<DocumentType>('INVOICE');
  const [receiverId, setReceiverId] = useState('');
  const [reference, setReference] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('0.00');

  const [registeredEnterprises, setRegisteredEnterprises] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authApi.getRegisteredEnterprises()
      .then((list) => {
        if (Array.isArray(list)) {
          const filtered = list.filter((e) => Boolean(e) && e.toLowerCase() !== currentEnterprise.toLowerCase());
          setRegisteredEnterprises(filtered);
        } else {
          setRegisteredEnterprises([]);
        }
      })
      .catch(() => {
        setRegisteredEnterprises([]);
      });
  }, [currentEnterprise]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Invoice specific 
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState('');
  const [poReference, setPoReference] = useState('');

  // PO specific
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('SENT');

  // Credit note specific
  const [originalInvoiceReference, setOriginalInvoiceReference] = useState('');
  const [reasonCode, setReasonCode] = useState('RETURN');
  const [refundImpact, setRefundImpact] = useState('APPLY_TO_BALANCE');

  // Line item grid
  const [items, setItems] = useState<DocumentItem[]>([
    { itemName: '', itemSku: '', quantity: 1, unitPrice: 0, taxRate: 0, lineTotal: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResponse, setSuccessResponse] = useState<{ documentId: string; status: string; message: string } | null>(null);

  const preventNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { itemName: '', itemSku: '', quantity: 1, unitPrice: 0, taxRate: 0, lineTotal: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...items];
    let processedValue = value;

    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      if (typeof value === 'string' && value.startsWith('-')) {
        processedValue = value.replace(/-/g, '');
      }
      const num = Number(processedValue);
      if (num < 0) {
        processedValue = Math.abs(num);
      }
    }

    const item = { ...updated[index], [field]: processedValue };

    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const taxRate = Math.max(0, Number(item.taxRate) || 0);
    const baseTotal = qty * price;
    const taxAmt = (baseTotal * taxRate) / 100;
    item.lineTotal = baseTotal + taxAmt;

    updated[index] = item;
    setItems(updated);
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0)), 0);
  const calculateTaxTotal = () => items.reduce((acc, item) => {
    const base = Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0);
    return acc + (base * Math.max(0, Number(item.taxRate) || 0)) / 100;
  }, 0);
  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const tax = calculateTaxTotal();
    const disc = Math.max(0, parseFloat(discount) || 0);
    return Math.max(0, sub + tax - disc);
  };

  const isLineItemsValid = items.length > 0 && items.every((item) => (
    Boolean(item.itemName && item.itemName.trim()) &&
    (Number(item.quantity) || 0) > 0 &&
    (Number(item.unitPrice) || 0) > 0
  ));

  const resetForm = () => {
    setDocumentType('INVOICE');
    setReceiverId('');
    setReference('');
    setCurrency('USD');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNotes('');
    setDiscount('0.00');

    // Invoice Specific
    setPaymentTerms('Net 30');
    setPaymentStatus('UNPAID');
    setAcceptedPaymentMethods('');
    setPoReference('');

    // PO Specific
    setDeliveryWindow('');
    setShippingMethod('');
    setRequestedBy('');
    setApprovalStatus('SENT');

    // Credit note specific
    setOriginalInvoiceReference('');
    setReasonCode('RETURN');
    setRefundImpact('APPLY_TO_BALANCE');

    // Line items
    setItems([
      { itemName: '', itemSku: '', quantity: 1, unitPrice: 0, taxRate: 0, lineTotal: 0 }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessResponse(null);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName || !item.itemName.trim()) {
        setError(`Line item #${i + 1} requires a valid title/name.`);
        return;
      }
      if ((Number(item.quantity) || 0) <= 0) {
        setError(`Line item #${i + 1} ("${item.itemName}") quantity must be greater than 0.`);
        return;
      }
      if ((Number(item.unitPrice) || 0) <= 0) {
        setError(`Line item #${i + 1} ("${item.itemName}") unit price must be greater than $0.00.`);
        return;
      }
      if ((Number(item.taxRate) || 0) < 0) {
        setError(`Line item #${i + 1} ("${item.itemName}") tax rate cannot be negative.`);
        return;
      }
    }

    const disc = parseFloat(discount) || 0;
    if (disc < 0) {
      setError('Discount amount cannot be negative.');
      return;
    }

    const grandTotal = calculateGrandTotal();
    if (grandTotal <= 0) {
      setError('Grand total must be greater than $0.00. Negative or zero total documents are not allowed.');
      return;
    }

    setLoading(true);

    const payload: DocumentSubmitRequest = {
      documentType,
      senderId: currentEnterprise,
      receiverId,
      reference,
      amount: grandTotal,
      currency,
      issueDate,
      dueDate,
      notes,
      subtotal: calculateSubtotal(),
      taxAmount: calculateTaxTotal(),
      discount: disc,
      items,

      // Invoice specific
      ...(documentType === 'INVOICE' && {
        paymentTerms,
        paymentStatus,
        acceptedPaymentMethods,
        poReference,
      }),

      // PO specific
      ...(documentType === 'ORDER' && {
        deliveryWindow,
        shippingMethod,
        requestedBy,
        approvalStatus,
      }),

      // Credit note specific
      ...(documentType === 'CREDIT_NOTE' && {
        originalInvoiceReference,
        reasonCode,
        refundImpact,
      }),
    };

    try {
      const res = await documentApi.submitDocument(payload);
      setSuccessResponse(res);
      onDocumentSubmitted(res.documentId);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-sage-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-sage-100">
        <div className="flex items-center space-x-3">
          <div className="bg-sage-100 text-[#8B9A6E] p-2.5 rounded-xl border border-sage-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Document Ingestion Gateway</h2>
            <p className="text-xs text-gray-500">Enterprise B2B Multi-Document Engine (Invoices, Orders, Credit Notes)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl">
          {error}
        </div>
      )}

      {successResponse && (
        <div className="bg-sage-50 border border-sage-300 text-sage-900 text-xs p-4 rounded-xl flex items-start justify-between">
          <div className="flex items-start space-x-3">
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
          {onViewTracker && (
            <button
              type="button"
              onClick={onViewTracker}
              className="bg-[#8B9A6E] hover:bg-sage-600 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-xs flex items-center space-x-1 shrink-0"
            >
              <span>View in Tracker</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">1. Global Header &amp; Parties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-bold focus:outline-none focus:border-[#8B9A6E]"
              >
                <option value="INVOICE">INVOICE</option>
                <option value="ORDER">PURCHASE ORDER (PO)</option>
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
                placeholder="e.g. INV-2026-00123 or PO-9921"
                className="w-full bg-sage-50/50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">Sender Enterprise (Your Enterprise)</label>
                <span className="text-[10px] text-[#8B9A6E] bg-sage-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Auto
                </span>
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled
                  readOnly
                  value={currentEnterprise}
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-700 font-semibold cursor-not-allowed opacity-85"
                />
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">Recipient / Receiver Enterprise</label>
                <span className="text-[10px] text-[#8B9A6E] bg-sage-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <Search className="w-2.5 h-2.5" /> Searchable Dropdown
                </span>
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={receiverId}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setReceiverId(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Type to filter or select recipient (e.g. AcmeCorp)"
                  className="w-full bg-sage-50/50 border border-gray-300 rounded-lg py-2.5 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B9A6E] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-1"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-sage-300 rounded-xl shadow-xl max-h-52 overflow-y-auto py-1 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-sage-100 flex items-center justify-between">
                    <span>Registered B2B Trading Partners</span>
                    <span>{registeredEnterprises.filter((e) => e.toLowerCase().includes(receiverId.toLowerCase().trim())).length} Match(es)</span>
                  </div>
                  {(() => {
                    const filtered = registeredEnterprises.filter((e) => e.toLowerCase().includes(receiverId.toLowerCase().trim()));
                    if (filtered.length > 0) {
                      return filtered.map((ent) => (
                        <button
                          key={ent}
                          type="button"
                          onClick={() => {
                            setReceiverId(ent);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-sage-100/70 flex items-center justify-between transition-colors font-semibold text-gray-900 border-b border-sage-50 last:border-0"
                        >
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-3.5 h-3.5 text-[#8B9A6E]" />
                            <span>{ent}</span>
                          </div>
                          <span className="text-[10px] bg-sage-100 text-sage-900 border border-sage-300 px-2 py-0.5 rounded-full font-mono font-bold">
                            ✓ Registered Partner
                          </span>
                        </button>
                      ));
                    }
                    return (
                      <div className="px-3 py-3 text-gray-500 italic text-center space-y-1">
                        <p>No registered partner matching &quot;{receiverId}&quot;</p>
                        <p className="text-[10px] text-gray-400 font-normal">Press enter to keep custom enterprise name</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Currency Code</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#8B9A6E] font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="LKR">LKR (Rs)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">Issue Date</label>
                <span className="text-[10px] text-[#8B9A6E] bg-sage-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Auto / Fixed for Audit
                </span>
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  disabled
                  readOnly
                  value={issueDate}
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-700 font-semibold cursor-not-allowed opacity-85"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-sage-50/60 border border-sage-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-[#8B9A6E]" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              2. {documentType} Document-Specific Metadata
            </h3>
          </div>

          {documentType === 'INVOICE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Accepted Payment Methods</label>
                <input
                  type="text"
                  value={acceptedPaymentMethods}
                  onChange={(e) => setAcceptedPaymentMethods(e.target.value)}
                  placeholder="e.g. Bank Transfer, Wire, PayPal"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Linked Purchase Order (PO) Ref</label>
                <input
                  type="text"
                  value={poReference}
                  onChange={(e) => setPoReference(e.target.value)}
                  placeholder="e.g. PO-9921 (Optional)"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-mono"
                />
              </div>
            </div>
          )}

          {documentType === 'ORDER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Delivery / Shipping Window</label>
                <input
                  type="text"
                  value={deliveryWindow}
                  onChange={(e) => setDeliveryWindow(e.target.value)}
                  placeholder="e.g. 2026-10-20 to 2026-10-25"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Shipping Carrier</label>
                <input
                  type="text"
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  placeholder="e.g. FedEx, DHL Freight"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Requested By (Employee / Manager)</label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="e.g. John Doe (Procurement)"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Approval Status</label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="SENT">SENT</option>
                  <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                  <option value="FULFILLED">FULFILLED</option>
                </select>
              </div>
            </div>
          )}

          {documentType === 'CREDIT_NOTE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Original Invoice Reference</label>
                <input
                  type="text"
                  required
                  value={originalInvoiceReference}
                  onChange={(e) => setOriginalInvoiceReference(e.target.value)}
                  placeholder="e.g. INV-2026-00123"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason Code</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="RETURN">Goods Return</option>
                  <option value="OVERCHARGE">Pricing Overcharge</option>
                  <option value="DAMAGED_GOODS">Damaged Goods</option>
                  <option value="BILLING_ERROR">Billing Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Refund / Balance Impact</label>
                <select
                  value={refundImpact}
                  onChange={(e) => setRefundImpact(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="APPLY_TO_BALANCE">Apply Credit to Account Balance</option>
                  <option value="CASH_REFUND">Trigger Cash Refund Payout</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. Line Item Grid (Product &amp; Service Table)</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-sage-100 hover:bg-sage-200 text-[#8B9A6E] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border border-sage-300 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-sage-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50 text-sage-900 uppercase font-mono border-b border-sage-200">
                <tr>
                  <th className="p-2.5">Item Name / Title</th>
                  <th className="p-2.5 w-24">SKU</th>
                  <th className="p-2.5 w-20">Qty</th>
                  <th className="p-2.5 w-24">Unit Price</th>
                  <th className="p-2.5 w-20">Tax %</th>
                  <th className="p-2.5 w-28 text-right">Line Total</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-sage-50/30">
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        placeholder="Item title"
                        value={item.itemName}
                        onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="SKU"
                        value={item.itemSku || ''}
                        onChange={(e) => updateItem(idx, 'itemSku', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.quantity}
                        onKeyDown={preventNegativeKeys}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onKeyDown={preventNegativeKeys}
                        onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.taxRate || 0}
                        onKeyDown={preventNegativeKeys}
                        onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-gray-900">
                      ${(item.lineTotal || 0).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-sage-50/70 border border-sage-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-1/2 space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Notes / Payment Instructions / Memos</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter invoice terms, bank payment details, or special delivery notes..."
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
            />
          </div>

          <div className="w-full md:w-80 bg-white border border-sage-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax Amount:</span>
              <span className="font-mono font-semibold">${calculateTaxTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Discount ($):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onKeyDown={preventNegativeKeys}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.startsWith('-')) val = val.replace(/-/g, '');
                  setDiscount(val);
                }}
                className="w-24 border border-gray-300 rounded px-2 py-0.5 text-right font-mono text-xs"
              />
            </div>
            <div className="border-t border-sage-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
              <span>Grand Total ({currency}):</span>
              <span className="font-mono text-[#8B9A6E]">${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isLineItemsValid}
          className="w-full bg-[#8B9A6E] hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Submitting to Queue...' : `Submit ${documentType} ($${calculateGrandTotal().toFixed(2)} ${currency})`}</span>
        </button>
      </form>
    </div>
  );
};
