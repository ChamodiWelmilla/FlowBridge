import axios from 'axios';
import {
  DocumentSubmitRequest,
  DocumentResponse,
  DocumentStatusResponse,
  AuthResponse,
  UserProfile,
  DLQDocument,
} from '../types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowbridge_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (enterpriseName: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/v1/auth/login', { enterpriseName, password });
    if (res.data.token) {
      localStorage.setItem('flowbridge_jwt', res.data.token);
      if (res.data.email) localStorage.setItem('flowbridge_email', res.data.email);
      if (res.data.enterpriseName) localStorage.setItem('flowbridge_enterprise', res.data.enterpriseName);
    }
    return res.data;
  },
  register: async (email: string, enterpriseName: string, password: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/v1/auth/register', {
      email,
      enterpriseName,
      password,
    });
    return res.data;
  },
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get<UserProfile>('/api/v1/auth/me');
    if (res.data.email) localStorage.setItem('flowbridge_email', res.data.email);
    if (res.data.enterpriseName) localStorage.setItem('flowbridge_enterprise', res.data.enterpriseName);
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/v1/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },
  getRegisteredEnterprises: async (): Promise<string[]> => {
    const res = await api.get<string[]>('/api/v1/auth/enterprises');
    return Array.isArray(res.data) ? res.data : [];
  },
  logout: () => {
    localStorage.removeItem('flowbridge_jwt');
    localStorage.removeItem('flowbridge_email');
    localStorage.removeItem('flowbridge_enterprise');
  },
  getToken: () => localStorage.getItem('flowbridge_jwt'),
  getEmail: () => localStorage.getItem('flowbridge_email') || '',
  getEnterpriseName: () => localStorage.getItem('flowbridge_enterprise') || '',
};

export const documentApi = {
  submitDocument: async (payload: DocumentSubmitRequest): Promise<{ documentId: string; status: string; message: string }> => {
    const res = await api.post('/api/v1/documents', payload);
    return res.data;
  },
  getMyDocuments: async (): Promise<DocumentResponse[]> => {
    const res = await api.get<DocumentResponse[]>('/api/v1/documents');
    return res.data;
  },
  getDocumentById: async (documentId: string): Promise<DocumentResponse> => {
    const res = await api.get<DocumentResponse>(`/api/v1/documents/${documentId}`);
    return res.data;
  },
  getDocumentStatus: async (documentId: string): Promise<DocumentStatusResponse> => {
    const res = await api.get<DocumentStatusResponse>(`/api/v1/documents/${documentId}/status`);
    return res.data;
  },
  performDocumentAction: async (documentId: string, actionData: import('../types').DocumentActionRequest): Promise<DocumentResponse> => {
    const res = await api.post<DocumentResponse>(`/api/v1/documents/${documentId}/action`, actionData);
    return res.data;
  },
};

export const dlqApi = {
  getDeadLetterDocuments: async (): Promise<DLQDocument[]> => {
    const res = await api.get<DLQDocument[]>('/api/v1/dead-letter/documents');
    return res.data;
  },
  reprocessDocument: async (documentId: string): Promise<{ documentId: string; message: string }> => {
    const res = await api.post(`/api/v1/dead-letter/documents/${documentId}/reprocess`);
    return res.data;
  },
};
