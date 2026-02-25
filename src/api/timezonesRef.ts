import type {
  CreateTimezoneRequest,
  ListTimezonesParams,
  ListTimezonesResponse,
  TimezoneRef,
  UpdateTimezoneRequest,
} from '../types/timezoneRef';

const API_BASE = '/v2/companies/timezones';

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

export async function listTimezones(params: ListTimezonesParams = {}): Promise<ListTimezonesResponse> {
  const query = new URLSearchParams();
  if (params.region) query.set('region', params.region);
  if (params.country_alpha2) query.set('country_alpha2', params.country_alpha2);
  if (params.is_active) query.set('is_active', params.is_active);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListTimezonesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getTimezone(tzName: string): Promise<{ timezone: TimezoneRef }> {
  return request<{ timezone: TimezoneRef }>(`${API_BASE}/get/${encodeURIComponent(tzName)}`);
}

export async function createTimezone(data: CreateTimezoneRequest): Promise<{ id: number }> {
  return request<{ id: number }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTimezone(id: number, data: UpdateTimezoneRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, id }),
  });
}

export async function deleteTimezone(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${id}`, {
    method: 'DELETE',
  });
}
