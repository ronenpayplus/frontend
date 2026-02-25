import type {
  ComplianceDocument,
  CreateComplianceDocumentRequest,
  ListComplianceDocumentsParams,
  ListComplianceDocumentsResponse,
  UpdateComplianceDocumentRequest,
} from '../types/complianceDocument';

const API_BASE = '/v2/companies/compliance-documents';

interface ApiEnvelope<T> {
  results: {
    status: string;
    code: number;
    description: string;
    message: unknown;
  };
  data: T;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  const envelope: ApiEnvelope<T> = await res.json();
  if (envelope.results?.status === 'error') {
    throw new Error(String(envelope.results.message) || 'API error');
  }
  return envelope.data;
}

export async function listComplianceDocuments(
  params: ListComplianceDocumentsParams,
): Promise<ListComplianceDocumentsResponse> {
  const query = new URLSearchParams();
  if (params.legal_entity_uuid) query.set('legal_entity_uuid', params.legal_entity_uuid);
  if (params.beneficial_owner_uuid) query.set('beneficial_owner_uuid', params.beneficial_owner_uuid);
  if (params.document_type) query.set('document_type', params.document_type);
  if (params.verification_status) query.set('verification_status', params.verification_status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListComplianceDocumentsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getComplianceDocument(uuid: string): Promise<{ compliance_document: ComplianceDocument }> {
  return request<{ compliance_document: ComplianceDocument }>(`${API_BASE}/get/${uuid}`);
}

export async function createComplianceDocument(
  data: CreateComplianceDocumentRequest,
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateComplianceDocument(
  uuid: string,
  data: UpdateComplianceDocumentRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteComplianceDocument(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
