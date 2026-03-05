import type { OrgEntityLocalization, OrgEntityOwnerType } from '../types/orgEntityLocalization';

const API_BASE = '/v2/companies';

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

export async function listOrgEntityLocalizations(
  ownerType: OrgEntityOwnerType,
  ownerUUID: string,
): Promise<OrgEntityLocalization[]> {
  const query = new URLSearchParams();
  query.set('owner_type', ownerType);
  query.set('owner_uuid', ownerUUID);
  query.set('page', '1');
  query.set('page_size', '100');
  const data = await request<{ org_entity_localizations?: OrgEntityLocalization[] }>(
    `${API_BASE}/localizations/list?${query.toString()}`,
  );
  return data.org_entity_localizations || [];
}
