import type {
  ChannelType,
  CreateChannelTypeRequest,
  ListChannelTypesParams,
  ListChannelTypesResponse,
  UpdateChannelTypeRequest,
} from '../types/channelType';

const API_BASE = '/v2/companies/channel-types';

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

export async function listChannelTypes(params: ListChannelTypesParams = {}): Promise<ListChannelTypesResponse> {
  const query = new URLSearchParams();
  if (params.is_active) query.set('is_active', params.is_active);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListChannelTypesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getChannelType(channelCode: string): Promise<{ channel_type: ChannelType }> {
  return request<{ channel_type: ChannelType }>(`${API_BASE}/get/${encodeURIComponent(channelCode)}`);
}

export async function createChannelType(data: CreateChannelTypeRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChannelType(
  channelCode: string,
  data: UpdateChannelTypeRequest
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${encodeURIComponent(channelCode)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, channel_code: data.channel_code || channelCode }),
  });
}

export async function deleteChannelType(channelCode: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${encodeURIComponent(channelCode)}`, {
    method: 'DELETE',
  });
}
