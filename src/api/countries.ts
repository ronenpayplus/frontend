import type {
  Country,
  CreateCountryRequest,
  ListCountriesParams,
  ListCountriesResponse,
  UpdateCountryRequest,
} from '../types/country';

const API_BASE = '/v2/companies/countries';

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

export async function listCountries(params: ListCountriesParams = {}): Promise<ListCountriesResponse> {
  const query = new URLSearchParams();
  if (params.region) query.set('region', params.region);
  if (params.is_active) query.set('is_active', params.is_active);
  if (params.is_sanctioned) query.set('is_sanctioned', params.is_sanctioned);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListCountriesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getCountry(alpha2: string): Promise<{ country: Country }> {
  return request<{ country: Country }>(`${API_BASE}/get/${alpha2}`);
}

export async function createCountry(data: CreateCountryRequest): Promise<{ id: number }> {
  return request<{ id: number }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCountry(id: number, data: UpdateCountryRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, id }),
  });
}

export async function deleteCountry(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${id}`, {
    method: 'DELETE',
  });
}
