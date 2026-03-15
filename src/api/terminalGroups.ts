import type {
  CreateTerminalGroupRequest,
  ListTerminalGroupsParams,
  ListTerminalGroupsResponse,
  TerminalGroup,
  UpdateTerminalGroupRequest,
} from '../types/terminalGroup';

const API_BASE = '/v2/accounts/terminal-groups';

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

export async function listTerminalGroups(
  params: ListTerminalGroupsParams = {},
): Promise<ListTerminalGroupsResponse> {
  const query = new URLSearchParams();
  if (params.store_uuid) query.set('store_uuid', params.store_uuid);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListTerminalGroupsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getTerminalGroup(uuid: string): Promise<{ terminal_group: TerminalGroup }> {
  return request<{ terminal_group: TerminalGroup }>(`${API_BASE}/get/${uuid}`);
}

export async function createTerminalGroup(data: CreateTerminalGroupRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTerminalGroup(
  uuid: string,
  data: UpdateTerminalGroupRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTerminalGroup(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
