import type {
  Account,
  AccountLocalization,
  AccountLocalizationInput,
  CreateAccountRequest,
  UpdateAccountRequest,
  ListAccountsResponse,
  ListAccountsParams,
} from '../types/account';

const API_BASE = '/v2/accounts';

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

export async function listAccounts(params: ListAccountsParams = {}): Promise<ListAccountsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.account_type) query.set('account_type', params.account_type);
  if (params.country) query.set('country', params.country);
  if (params.created_at_from) query.set('created_at_from', params.created_at_from);
  if (params.created_at_to) query.set('created_at_to', params.created_at_to);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));

  return request<ListAccountsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getAccount(uuid: string): Promise<{ account: Account }> {
  return request<{ account: Account }>(`${API_BASE}/get/${uuid}`);
}

export async function createAccount(data: CreateAccountRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createAccountWithLocalizations(data: CreateAccountRequest & { localizations: AccountLocalizationInput[] }): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create-with-localizations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAccount(uuid: string, data: UpdateAccountRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateAccountWithLocalizations(
  data: UpdateAccountRequest & { uuid: string; localizations: AccountLocalizationInput[] },
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update-with-localizations`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function listAccountLocalizations(accountUUID: string): Promise<AccountLocalization[]> {
  const query = new URLSearchParams();
  query.set('owner_type', 'account');
  query.set('owner_uuid', accountUUID);
  query.set('page', '1');
  query.set('page_size', '100');
  const data = await request<{ org_entity_localizations?: AccountLocalization[] }>(
    `${API_BASE}/localizations/list?${query.toString()}`,
  );
  return data.org_entity_localizations || [];
}

export async function deleteAccount(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
