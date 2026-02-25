import type {
  CreateSubMerchantAccountRequest,
  ListSubMerchantAccountsParams,
  ListSubMerchantAccountsResponse,
  SubMerchantAccount,
  UpdateSubMerchantAccountRequest,
} from '../types/subMerchantAccount';

const API_BASE = '/v2/companies/sub-merchants';

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

export async function listSubMerchantAccounts(
  params: ListSubMerchantAccountsParams = {},
): Promise<ListSubMerchantAccountsResponse> {
  const query = new URLSearchParams();
  if (params.merchant_account_uuid) query.set('merchant_account_uuid', params.merchant_account_uuid);
  if (params.merchant_uuid) query.set('merchant_uuid', params.merchant_uuid);
  if (params.status) query.set('status', params.status);
  if (params.onboarding_status) query.set('onboarding_status', params.onboarding_status);
  if (params.kyc_status) query.set('kyc_status', params.kyc_status);
  if (params.country) query.set('country', params.country);
  if (params.currency) query.set('currency', params.currency);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListSubMerchantAccountsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getSubMerchantAccount(uuid: string): Promise<{ sub_merchant_account: SubMerchantAccount }> {
  return request<{ sub_merchant_account: SubMerchantAccount }>(`${API_BASE}/get/${uuid}`);
}

export async function createSubMerchantAccount(
  data: CreateSubMerchantAccountRequest,
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSubMerchantAccount(
  uuid: string,
  data: UpdateSubMerchantAccountRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteSubMerchantAccount(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
