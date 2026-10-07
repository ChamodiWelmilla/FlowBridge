export type DocumentType = 'INVOICE' | 'ORDER' | 'CREDIT_NOTE';

export type DocumentStatus =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'PROCESSING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'VALIDATION_FAILED'
  | 'DELIVERY_FAILED'
  | 'RETRY_PENDING';

export interface DocumentSubmitRequest {
  documentType: DocumentType;
  senderId: string;
  receiverId: string;
  reference: string;
  amount: number;
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
}

export interface EventSummary {
  eventType: string;
  previousStatus: string | null;
  newStatus: string;
  timestamp: string;
}

export interface DocumentStatusResponse {
  documentId: string;
  status: DocumentStatus;
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
