import type {
  ListSubMerchantMethodsResponse,
  SetSubMerchantMethodsRequest,
  SetSubMerchantMethodsResponse,
} from '../types/subMerchantMethod';

const API_BASE = '/v2/accounts/sub-merchant-methods';

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

export async function listSubMerchantMethods(
  subMerchantUUID: string,
): Promise<ListSubMerchantMethodsResponse> {
  const query = new URLSearchParams();
  query.set('sub_merchant_uuid', subMerchantUUID);
  return request<ListSubMerchantMethodsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function setSubMerchantMethods(
  data: SetSubMerchantMethodsRequest,
): Promise<SetSubMerchantMethodsResponse> {
  return request<SetSubMerchantMethodsResponse>(`${API_BASE}/set-methods`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
