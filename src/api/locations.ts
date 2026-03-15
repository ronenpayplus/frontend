import type {
  CreateLocationRequest,
  ListLocationsParams,
  ListLocationsResponse,
  Location,
  UpdateLocationRequest,
} from '../types/location';

const API_BASE = '/v2/accounts/locations';

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

export async function listLocations(params: ListLocationsParams = {}): Promise<ListLocationsResponse> {
  const query = new URLSearchParams();
  if (params.account_uuid) query.set('account_uuid', params.account_uuid);
  if (params.location_type) query.set('location_type', params.location_type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListLocationsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getLocation(uuid: string): Promise<{ location: Location }> {
  return request<{ location: Location }>(`${API_BASE}/get/${uuid}`);
}

export async function createLocation(data: CreateLocationRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLocation(uuid: string, data: UpdateLocationRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
