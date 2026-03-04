import type {
  ListMerchantAccountMethodsResponse,
  SetMerchantAccountMethodsRequest,
  SetMerchantAccountMethodsResponse,
} from '../types/merchantAccountMethod';

const API_BASE = '/v2/companies/merchant-account-methods';

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
    throw new Error(body || `HTTP ${res.status} ${url}`);
  }
  const json = await res.json();
  const envelope = json as ApiEnvelope<T>;
  if (envelope.results?.status === 'error') {
    throw new Error(String(envelope.results.message) || 'API error');
  }
  return (envelope.data ?? json) as T;
}

export async function listMerchantAccountMethods(
  merchantAccountUUID: string,
): Promise<ListMerchantAccountMethodsResponse> {
  const query = new URLSearchParams();
  query.set('merchant_account_uuid', merchantAccountUUID);
  return request<ListMerchantAccountMethodsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function setMerchantAccountMethods(
  data: SetMerchantAccountMethodsRequest,
): Promise<SetMerchantAccountMethodsResponse> {
  return request<SetMerchantAccountMethodsResponse>(`${API_BASE}/set-methods`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
