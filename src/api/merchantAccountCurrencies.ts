import type {
  CreateMerchantAccountCurrencyRequest,
  DeleteMerchantAccountCurrencyRequest,
  ListMerchantAccountCurrenciesResponse,
  MerchantAccountCurrency,
} from '../types/merchantAccountCurrency';

const API_BASE = '/v2/companies/merchant-account-currencies';

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

export async function listMerchantAccountCurrencies(
  merchantAccountUUID: string,
): Promise<ListMerchantAccountCurrenciesResponse> {
  const query = new URLSearchParams();
  query.set('merchant_account_uuid', merchantAccountUUID);
  return request<ListMerchantAccountCurrenciesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function createMerchantAccountCurrency(
  data: CreateMerchantAccountCurrencyRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMerchantAccountCurrency(
  data: DeleteMerchantAccountCurrencyRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    `${API_BASE}/delete/${data.merchant_account_uuid}/${data.currency_code}`,
    { method: 'DELETE' },
  );
}

/**
 * Syncs the merchant account's currencies to match the desired list.
 * Computes diff against current state and issues create/delete calls.
 * Returns the list of currencies after sync.
 */
export async function syncMerchantAccountCurrencies(
  merchantAccountUUID: string,
  desiredCurrencyCodes: string[],
): Promise<MerchantAccountCurrency[]> {
  const current = await listMerchantAccountCurrencies(merchantAccountUUID);
  const currentCodes = new Set(
    (current.merchant_account_currencies || []).map((c) => c.currency_code),
  );
  const desiredSet = new Set(desiredCurrencyCodes);

  const toAdd = desiredCurrencyCodes.filter((code) => !currentCodes.has(code));
  const toRemove = [...currentCodes].filter((code) => !desiredSet.has(code));

  await Promise.all([
    ...toAdd.map((currency_code) =>
      createMerchantAccountCurrency({ merchant_account_uuid: merchantAccountUUID, currency_code }),
    ),
    ...toRemove.map((currency_code) =>
      deleteMerchantAccountCurrency({ merchant_account_uuid: merchantAccountUUID, currency_code }),
    ),
  ]);

  const updated = await listMerchantAccountCurrencies(merchantAccountUUID);
  return updated.merchant_account_currencies || [];
}
