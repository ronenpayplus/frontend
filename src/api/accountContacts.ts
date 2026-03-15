import type {
  AccountContact,
  CreateAccountContactRequest,
  ListAccountContactsParams,
  ListAccountContactsResponse,
  UpdateAccountContactRequest,
} from '../types/accountContact';

const API_BASE = '/v2/accounts/contacts';

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

export async function listAccountContacts(
  params: ListAccountContactsParams,
): Promise<ListAccountContactsResponse> {
  const query = new URLSearchParams();
  query.set('account_uuid', params.account_uuid);
  if (params.search) query.set('search', params.search);
  if (params.contact_type) query.set('contact_type', params.contact_type);
  if (params.is_default) query.set('is_default', params.is_default);
  if (params.is_primary) query.set('is_primary', params.is_primary);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListAccountContactsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getAccountContact(uuid: string): Promise<{ contact: AccountContact }> {
  return request<{ contact: AccountContact }>(`${API_BASE}/get/${uuid}`);
}

export async function createAccountContact(
  data: CreateAccountContactRequest,
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAccountContact(
  uuid: string,
  data: UpdateAccountContactRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteAccountContact(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
