import type {
  CreateTerminalRequest,
  ListTerminalsParams,
  ListTerminalsResponse,
  Terminal,
  UpdateTerminalRequest,
} from '../types/terminal';

const API_BASE = '/v2/accounts/terminals';

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

export async function listTerminals(params: ListTerminalsParams = {}): Promise<ListTerminalsResponse> {
  const query = new URLSearchParams();
  if (params.terminal_group_uuid) query.set('terminal_group_uuid', params.terminal_group_uuid);
  if (params.terminal_type) query.set('terminal_type', params.terminal_type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListTerminalsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getTerminal(uuid: string): Promise<{ terminal: Terminal }> {
  return request<{ terminal: Terminal }>(`${API_BASE}/get/${uuid}`);
}

export async function createTerminal(data: CreateTerminalRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTerminal(uuid: string, data: UpdateTerminalRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTerminal(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
