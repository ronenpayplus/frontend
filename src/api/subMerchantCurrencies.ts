import type {
  CreateSubMerchantCurrencyRequest,
  DeleteSubMerchantCurrencyRequest,
  ListSubMerchantCurrenciesResponse,
  SubMerchantCurrency,
} from '../types/subMerchantCurrency';

const API_BASE = '/v2/companies/sub-merchant-currencies';

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

export async function listSubMerchantCurrencies(
  subMerchantUUID: string,
): Promise<ListSubMerchantCurrenciesResponse> {
  const query = new URLSearchParams();
  query.set('sub_merchant_uuid', subMerchantUUID);
  return request<ListSubMerchantCurrenciesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function createSubMerchantCurrency(
  data: CreateSubMerchantCurrencyRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSubMerchantCurrency(
  data: DeleteSubMerchantCurrencyRequest,
): Promise<{ success: boolean }> {
  const query = new URLSearchParams();
  query.set('sub_merchant_uuid', data.sub_merchant_uuid);
  query.set('currency_code', data.currency_code);
  return request<{ success: boolean }>(`${API_BASE}/delete?${query.toString()}`, {
    method: 'DELETE',
  });
}

export async function syncSubMerchantCurrencies(
  subMerchantUUID: string,
  desiredCurrencyCodes: string[],
): Promise<SubMerchantCurrency[]> {
  const current = await listSubMerchantCurrencies(subMerchantUUID);
  const currentCodes = new Set((current.sub_merchant_currencies || []).map((c) => c.currency_code));
  const desiredSet = new Set(desiredCurrencyCodes);

  const toAdd = desiredCurrencyCodes.filter((code) => !currentCodes.has(code));
  const toRemove = [...currentCodes].filter((code) => !desiredSet.has(code));

  await Promise.all([
    ...toAdd.map((currency_code) =>
      createSubMerchantCurrency({ sub_merchant_uuid: subMerchantUUID, currency_code }),
    ),
    ...toRemove.map((currency_code) =>
      deleteSubMerchantCurrency({ sub_merchant_uuid: subMerchantUUID, currency_code }),
    ),
  ]);

  const updated = await listSubMerchantCurrencies(subMerchantUUID);
  return updated.sub_merchant_currencies || [];
}
