import type {
  AddressEntity,
  CreateAddressRequest,
  ListAddressesParams,
  ListAddressesResponse,
  UpdateAddressRequest,
} from '../types/addressEntity';

const API_BASE = '/v2/companies/addresses';

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

export async function listAddresses(params: ListAddressesParams = {}): Promise<ListAddressesResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.address_type) query.set('address_type', params.address_type);
  if (params.country_code) query.set('country_code', params.country_code);
  if (params.city) query.set('city', params.city);
  if (params.validated) query.set('validated', params.validated);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 50));
  return request<ListAddressesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function createAddress(data: CreateAddressRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAddress(uuid: string, data: UpdateAddressRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteAddress(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}

export async function getAddress(uuid: string): Promise<{ address: AddressEntity }> {
  return request<{ address: AddressEntity }>(`${API_BASE}/get/${uuid}`);
}
