import type {
  CreateStationRequest,
  ListStationsParams,
  ListStationsResponse,
  Station,
  UpdateStationRequest,
} from '../types/station';

const API_BASE = '/v2/accounts/stations';

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

export async function listStations(params: ListStationsParams = {}): Promise<ListStationsResponse> {
  const query = new URLSearchParams();
  if (params.store_uuid) query.set('store_uuid', params.store_uuid);
  if (params.station_type) query.set('station_type', params.station_type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListStationsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getStation(uuid: string): Promise<{ station: Station }> {
  return request<{ station: Station }>(`${API_BASE}/get/${uuid}`);
}

export async function createStation(data: CreateStationRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create-with-address-and-location`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStation(uuid: string, data: UpdateStationRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update-with-address-and-location`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteStation(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
