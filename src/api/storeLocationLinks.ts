import type {
  CreateStoreLocationLinkRequest,
  DeleteStoreLocationLinkRequest,
  ListStoreLocationLinksResponse,
} from '../types/storeLocationLink';

const API_BASE = '/v2/companies/store-location-links';

interface ApiEnvelope<T> {
  results: { status: string; code: number; description: string; message: unknown };
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

export async function listStoreLocationLinks(
  storeUUID: string,
): Promise<ListStoreLocationLinksResponse> {
  const query = new URLSearchParams();
  query.set('store_uuid', storeUUID);
  return request<ListStoreLocationLinksResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function createStoreLocationLink(
  data: CreateStoreLocationLinkRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteStoreLocationLink(
  data: DeleteStoreLocationLinkRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete`, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
}
