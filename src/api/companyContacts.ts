import type {
  CompanyContact,
  CreateCompanyContactRequest,
  ListCompanyContactsParams,
  ListCompanyContactsResponse,
  UpdateCompanyContactRequest,
} from '../types/companyContact';

const API_BASE = '/v2/companies/contacts';

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

export async function listCompanyContacts(
  params: ListCompanyContactsParams,
): Promise<ListCompanyContactsResponse> {
  const query = new URLSearchParams();
  query.set('company_uuid', params.company_uuid);
  if (params.search) query.set('search', params.search);
  if (params.contact_type) query.set('contact_type', params.contact_type);
  if (params.is_default) query.set('is_default', params.is_default);
  if (params.is_primary) query.set('is_primary', params.is_primary);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListCompanyContactsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getCompanyContact(uuid: string): Promise<{ contact: CompanyContact }> {
  return request<{ contact: CompanyContact }>(`${API_BASE}/get/${uuid}`);
}

export async function createCompanyContact(
  data: CreateCompanyContactRequest,
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompanyContact(
  uuid: string,
  data: UpdateCompanyContactRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteCompanyContact(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
