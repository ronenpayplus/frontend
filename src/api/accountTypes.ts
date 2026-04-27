import type { ListAccountTypesParams, ListAccountTypesResponse } from '../types/accountType';

const API_BASE = '/v2/accounts/account-types';

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

export async function listAccountTypes(params: ListAccountTypesParams = {}): Promise<ListAccountTypesResponse> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.is_active) query.set('is_active', params.is_active);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 200));
  return request<ListAccountTypesResponse>(`${API_BASE}/list?${query.toString()}`);
}
