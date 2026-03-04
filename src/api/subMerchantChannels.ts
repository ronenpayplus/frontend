import type {
  ListSubMerchantChannelsResponse,
  SetSubMerchantChannelsRequest,
  SetSubMerchantChannelsResponse,
} from '../types/subMerchantChannel';

const API_BASE = '/v2/companies/sub-merchant-channels';

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

export async function listSubMerchantChannels(
  subMerchantUUID: string,
): Promise<ListSubMerchantChannelsResponse> {
  const query = new URLSearchParams();
  query.set('sub_merchant_uuid', subMerchantUUID);
  return request<ListSubMerchantChannelsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function setSubMerchantChannels(
  data: SetSubMerchantChannelsRequest,
): Promise<SetSubMerchantChannelsResponse> {
  return request<SetSubMerchantChannelsResponse>(`${API_BASE}/set-channels`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
