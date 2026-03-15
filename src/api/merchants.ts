import type {
  CreateMerchantRequest,
  ListMerchantsParams,
  ListMerchantsResponse,
  Merchant,
  UpdateMerchantRequest,
} from '../types/merchant';
import type { LocalizationInput } from '../types/orgEntityLocalization';

const API_BASE = '/v2/accounts/merchants';

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

export async function listMerchants(params: ListMerchantsParams): Promise<ListMerchantsResponse> {
  const query = new URLSearchParams();
  if (params.legal_entity_uuid) query.set('legal_entity_uuid', params.legal_entity_uuid);
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.business_model) query.set('business_model', params.business_model);
  if (params.category_code) query.set('category_code', params.category_code);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListMerchantsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function createMerchant(data: CreateMerchantRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createMerchantWithLocalizations(
  data: CreateMerchantRequest & { localizations: LocalizationInput[] },
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create-with-localizations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMerchant(uuid: string): Promise<{ merchant: Merchant }> {
  return request<{ merchant: Merchant }>(`${API_BASE}/get/${uuid}`);
}

export async function updateMerchant(uuid: string, data: UpdateMerchantRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateMerchantWithLocalizations(
  data: UpdateMerchantRequest & { uuid: string; localizations: LocalizationInput[] },
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update-with-localizations`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMerchant(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
