import type {
  CreatePaymentMethodRequest,
  ListPaymentMethodsParams,
  ListPaymentMethodsResponse,
  PaymentMethod,
  UpdatePaymentMethodRequest,
} from '../types/paymentMethod';

const API_BASE = '/v2/accounts/payment-methods';

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

export async function listPaymentMethods(params: ListPaymentMethodsParams = {}): Promise<ListPaymentMethodsResponse> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.is_active) query.set('is_active', params.is_active);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  return request<ListPaymentMethodsResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getPaymentMethod(methodCode: string): Promise<{ payment_method: PaymentMethod }> {
  return request<{ payment_method: PaymentMethod }>(`${API_BASE}/get/${encodeURIComponent(methodCode)}`);
}

export async function createPaymentMethod(data: CreatePaymentMethodRequest): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePaymentMethod(
  methodCode: string,
  data: UpdatePaymentMethodRequest
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${encodeURIComponent(methodCode)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, method_code: data.method_code || methodCode }),
  });
}

export async function deletePaymentMethod(methodCode: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${encodeURIComponent(methodCode)}`, {
    method: 'DELETE',
  });
}
