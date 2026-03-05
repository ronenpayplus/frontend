import type { Pagination } from './company';

export interface BeneficialOwner {
  uuid: string;
  legal_entity_uuid: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  national_id?: string;
  national_id_type?: string;
  ownership_percentage: number;
  role: string;
  address_id?: number;
  pep_status: boolean;
  sanctions_clear?: boolean;
  verification_status: string;
  verified_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListBeneficialOwnersParams {
  legal_entity_uuid: string;
  search?: string;
  role?: string;
  verification_status?: string;
  nationality?: string;
  page?: number;
  page_size?: number;
}

export interface ListBeneficialOwnersResponse {
  beneficial_owners: BeneficialOwner[];
  pagination: Pagination;
}

export interface CreateBeneficialOwnerRequest {
  legal_entity_uuid: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  national_id?: string;
  national_id_type?: string;
  ownership_percentage: number;
  role: string;
  address_id?: number;
  pep_status: boolean;
  sanctions_clear?: boolean;
}

export interface UpdateBeneficialOwnerRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  national_id?: string;
  national_id_type?: string;
  ownership_percentage: number;
  role: string;
  address_id?: number;
  pep_status: boolean;
  sanctions_clear?: boolean;
  verification_status: string;
}

export const BENEFICIAL_OWNER_ROLES = ['owner', 'director', 'controller', 'signatory'] as const;
export const BENEFICIAL_OWNER_NATIONAL_ID_TYPES = ['passport', 'national_id', 'drivers_license', 'other'] as const;
export const BENEFICIAL_OWNER_VERIFICATION_STATUSES = ['pending', 'verified', 'failed', 'expired'] as const;

export const BENEFICIAL_OWNER_ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  director: 'Director',
  controller: 'Controller',
  signatory: 'Authorized Signatory',
};
