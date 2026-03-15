import type {
  BeneficialOwner,
  CreateBeneficialOwnerRequest,
  ListBeneficialOwnersParams,
  ListBeneficialOwnersResponse,
  UpdateBeneficialOwnerRequest,
} from '../types/beneficialOwner';

const API_BASE = '/v2/accounts/beneficial-owners';

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

export async function listBeneficialOwners(
  params: ListBeneficialOwnersParams,
): Promise<ListBeneficialOwnersResponse> {
  const query = new URLSearchParams();
  query.set('legal_entity_uuid', params.legal_entity_uuid);
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.verification_status) query.set('verification_status', params.verification_status);
  if (params.nationality) query.set('nationality', params.nationality);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 10));
  return request<ListBeneficialOwnersResponse>(`${API_BASE}/list?${query.toString()}`);
}

export async function getBeneficialOwner(uuid: string): Promise<{ beneficial_owner: BeneficialOwner }> {
  return request<{ beneficial_owner: BeneficialOwner }>(`${API_BASE}/get/${uuid}`);
}

export async function createBeneficialOwner(
  data: CreateBeneficialOwnerRequest,
): Promise<{ uuid: string }> {
  return request<{ uuid: string }>(`${API_BASE}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBeneficialOwner(
  uuid: string,
  data: UpdateBeneficialOwnerRequest,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/update/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, uuid }),
  });
}

export async function deleteBeneficialOwner(uuid: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/delete/${uuid}`, {
    method: 'DELETE',
  });
}
