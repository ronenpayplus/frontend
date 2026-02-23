import type { CreateStoreRequest, ListStoresParams, ListStoresResponse, Store, UpdateStoreRequest } from '../types/store';

const API_BASE = '/v2/companies/stores';

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

export async function listStores(params: ListStoresParams = {}): Promise<ListStoresResponse> {
  const query = new URLSearchParams();
  if (params.merchant_account_uuid) query.set('merchant_account_uuid', params.merchant_account_uuid);
  if (params.store_type) query.set('store_type', params.store_type);
  if (params.channel_type) query.set('channel_type', params.channel_type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListStoresResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getStore(uuid: string): Promise<{ store: Store }> {
  return request<{ store: Store }>(`${API_BASE}/get/${uuid}`);
}

export async function createStore(data: CreateStoreRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStore(uuid: string, data: UpdateStoreRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStore(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
