import type {
  CreateMerchantAccountRequest,
  ListMerchantAccountsParams,
  ListMerchantAccountsResponse,
  MerchantAccount,
  UpdateMerchantAccountRequest,
} from '../types/merchantAccount';

const API_BASE = '/v2/companies/merchant-accounts';

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

export async function listMerchantAccounts(
  params: ListMerchantAccountsParams = {},
): Promise<ListMerchantAccountsResponse> {
  const query = new URLSearchParams();
  if (params.merchant_uuid) query.set('merchant_uuid', params.merchant_uuid);
  if (params.company_uuid) query.set('company_uuid', params.company_uuid);
  if (params.legal_entity_uuid) query.set('legal_entity_uuid', params.legal_entity_uuid);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListMerchantAccountsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getMerchantAccount(uuid: string): Promise<{ merchant_account: MerchantAccount }> {
  return request<{ merchant_account: MerchantAccount }>(`${API_BASE}/get/${uuid}`);
}

export async function createMerchantAccount(
  data: CreateMerchantAccountRequest,
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create-with-currencies`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      currencies: [
        {
          currency_code: data.currency,
          is_default: true,
        },
      ],
    }),
  });
}

export async function updateMerchantAccount(
  uuid: string,
  data: UpdateMerchantAccountRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update-with-currencies`, {
    method: 'PUT',
    body: JSON.stringify({
      ...data,
      uuid: data.uuid || uuid,
      currencies: [
        {
          currency_code: data.currency,
          is_default: true,
        },
      ],
    }),
  });
}

export async function deleteMerchantAccount(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
