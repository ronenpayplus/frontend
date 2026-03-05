import type {
  CreateLegalEntityRequest,
  ListLegalEntitiesParams,
  ListLegalEntitiesResponse,
  UpdateLegalEntityRequest,
  LegalEntity,
} from '../types/legalEntity';
import type { LocalizationInput } from '../types/orgEntityLocalization';

const API_BASE = '/v2/companies/legal-entities';

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

export async function listLegalEntities(params: ListLegalEntitiesParams): Promise<ListLegalEntitiesResponse> {
  const query = new URLSearchParams();
  query.set('company_uuid', params.company_uuid);
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.entity_type) query.set('entity_type', params.entity_type);
  if (params.kyc_status) query.set('kyc_status', params.kyc_status);
  if (params.country) query.set('country', params.country);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListLegalEntitiesResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function createLegalEntity(data: CreateLegalEntityRequest): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createLegalEntityWithLocalizations(
  data: CreateLegalEntityRequest & { localizations: LocalizationInput[] },
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create-with-localizations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getLegalEntity(uuid: string): Promise<{ legal_entity: LegalEntity }> {
  return request<{ legal_entity: LegalEntity }>(`${API_BASE}/get/${uuid}`);
}

export async function updateLegalEntity(
  uuid: string,
  data: UpdateLegalEntityRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateLegalEntityWithLocalizations(data: {
  uuid: string;
  localizations: LocalizationInput[];
}): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update-with-localizations`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLegalEntity(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
