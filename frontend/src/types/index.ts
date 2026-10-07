export type DocumentType = 'INVOICE' | 'ORDER' | 'CREDIT_NOTE';

export type DocumentStatus =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'PROCESSING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'OPENED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CHANGE_REQUESTED'
  | 'REVISION_ACCEPTED'
  | 'REVISION_REJECTED'
  | 'VALIDATION_FAILED'
  | 'DELIVERY_FAILED'
  | 'RETRY_PENDING';

export interface DocumentActionRequest {
  action:
    | 'ACCEPT'
    | 'DECLINE'
    | 'REQUEST_CHANGE'
    | 'OPEN'
    | 'ACCEPT_REVISION'
    | 'COUNTER_REVISION'
    | 'REJECT_REVISION';
  comments?: string;
  signerName?: string;
  signerRole?: string;
}

export interface DocumentItem {
  id?: string;
  itemSku?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  lineTotal: number;
}

export interface DocumentSubmitRequest {
  documentType: DocumentType;
  senderId: string;
  receiverId: string;
  reference: string;
  amount: number;
  
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  discount?: number;
  notes?: string;
  senderTaxId?: string;
  senderAddress?: string;
  recipientTaxId?: string;
  recipientAddress?: string;
  
  // Line items
  items?: DocumentItem[];
  
  // Invoice specific
  paymentTerms?: string;
  paymentStatus?: string;
  acceptedPaymentMethods?: string;
  poReference?: string;
  
  // PO specific
  deliveryWindow?: string;
  shippingMethod?: string;
  requestedBy?: string;
  approvalStatus?: string;
  
  // Credit note specific
  originalInvoiceReference?: string;
  reasonCode?: string;
  refundImpact?: string;
}

export interface DocumentResponse {
  documentId: string;
  reference: string;
  documentType: DocumentType;
  senderId: string;
  receiverId: string;
  amount: number;
  status: DocumentStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  discount?: number;
  notes?: string;
  senderTaxId?: string;
  senderAddress?: string;
  recipientTaxId?: string;
  recipientAddress?: string;
  
  // Line items
  items?: DocumentItem[];
  
  // Invoice specific
  paymentTerms?: string;
  paymentStatus?: string;
  acceptedPaymentMethods?: string;
  poReference?: string;
  
  // PO specific
  deliveryWindow?: string;
  shippingMethod?: string;
  requestedBy?: string;
  approvalStatus?: string;
  
  // Credit note specific
  originalInvoiceReference?: string;
  reasonCode?: string;
  refundImpact?: string;

  // Recipient digital signature
  signatureData?: string;
  signedBy?: string;
  signerRole?: string;
  actionComments?: string;
  actionTimestamp?: string;

  // For failures
  failureReason?: string;
}

export interface EventSummary {
  eventType: string;
  previousStatus: string | null;
  newStatus: string;
  payload?: string;
  timestamp: string;
}

export interface DocumentStatusResponse {
  documentId: string;
  status: DocumentStatus;
  failureReason?: string;
  updatedAt: string;
  history: EventSummary[];
}

export interface AuthResponse {
  token: string;
  type: string;
  email?: string;
  enterpriseName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  enterpriseName: string;
  role: string;
}

export interface DLQDocument {
  id: string;
  externalReference: string;
  documentType: DocumentType;
  senderId: string;
  receiverId: string;
  amount: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}
