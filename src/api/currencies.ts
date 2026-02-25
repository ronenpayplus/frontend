import type {
  CreateCurrencyRequest,
  Currency,
  ListCurrenciesParams,
  ListCurrenciesResponse,
  UpdateCurrencyRequest,
} from '../types/currency';

const API_BASE = '/v2/companies/currencies';

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

export async function listCurrencies(params: ListCurrenciesParams = {}): Promise<ListCurrenciesResponse> {
  const query = new URLSearchParams();
  if (params.is_active) query.set('is_active', params.is_active);
  if (params.is_crypto) query.set('is_crypto', params.is_crypto);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListCurrenciesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getCurrency(alpha3: string): Promise<{ currency: Currency }> {
  return request<{ currency: Currency }>(`${API_BASE}/get/${alpha3}`);
}

export async function createCurrency(data: CreateCurrencyRequest): Promise<{ id: number }> {
  return request<{ id: number }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCurrency(id: number, data: UpdateCurrencyRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, id }),
  });
}

export async function deleteCurrency(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${id}`, {
    method: 'DELETE',
  });
}
