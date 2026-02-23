import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  ListCompaniesResponse,
  ListCompaniesParams,
} from '../types/company';

const API_BASE = '/v2/companies';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function listCompanies(params: ListCompaniesParams = {}): Promise<ListCompaniesResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.company_type) query.set('company_type', params.company_type);
  if (params.country) query.set('country', params.country);
  if (params.created_at_from) query.set('created_at_from', params.created_at_from);
  if (params.created_at_to) query.set('created_at_to', params.created_at_to);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));

  return request<ListCompaniesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getCompany(uuid: string): Promise<{ company: Company }> {
  return request<{ company: Company }>(`${API_BASE}/get/${uuid}`);
}

export async function createCompany(data: CreateCompanyRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompany(uuid: string, data: UpdateCompanyRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCompany(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
