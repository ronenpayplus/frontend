import type {
  ListMerchantAccountChannelsResponse,
  SetMerchantAccountChannelsRequest,
  SetMerchantAccountChannelsResponse,
} from '../types/merchantAccountChannel';

const API_BASE = '/v2/accounts/merchant-account-channels';

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

export async function listMerchantAccountChannels(
  merchantAccountUUID: string,
): Promise<ListMerchantAccountChannelsResponse> {
  const query = new URLSearchParams();
  query.set('merchant_account_uuid', merchantAccountUUID);
  return request<ListMerchantAccountChannelsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function setMerchantAccountChannels(
  data: SetMerchantAccountChannelsRequest,
): Promise<SetMerchantAccountChannelsResponse> {
  return request<SetMerchantAccountChannelsResponse>(`${API_BASE}/set-channels`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
