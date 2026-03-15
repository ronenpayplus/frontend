import type { Pagination } from './account';
import type { AddressInput } from './address';

export interface BeneficialOwner {
  uuid: string;
  legal_entity_uuid: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  national_id?: string;
  national_id_type?: string;
  email?: string;
  job_title?: string;
  owner_entity_type?: string;
  account_name?: string;
  account_type?: string;
  account_country?: string;
  account_registration_number?: string;
  account_tax_id?: string;
  account_website?: string;
  ownership_percentage: number;
  role: string;
  address_id?: number;
  address?: AddressInput;
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
  email?: string;
  job_title?: string;
  owner_entity_type?: string;
  account_name?: string;
  account_type?: string;
  account_country?: string;
  account_registration_number?: string;
  account_tax_id?: string;
  account_website?: string;
  ownership_percentage: number;
  role: string;
  address_id?: number;
  address?: AddressInput;
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
  email?: string;
  job_title?: string;
  owner_entity_type?: string;
  account_name?: string;
  account_type?: string;
  account_country?: string;
  account_registration_number?: string;
  account_tax_id?: string;
  account_website?: string;
  ownership_percentage: number;
  role: string;
  address_id?: number;
  address?: AddressInput;
  pep_status: boolean;
  sanctions_clear?: boolean;
  verification_status: string;
}

export const OWNER_ENTITY_TYPES = ['individual', 'corporate'] as const;

export const OWNER_ENTITY_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  corporate: 'Corporate Entity',
};

export const BENEFICIAL_OWNER_ROLES = ['owner', 'director', 'controller', 'signatory'] as const;
export const BENEFICIAL_OWNER_NATIONAL_ID_TYPES = ['passport', 'national_id', 'drivers_license', 'other'] as const;
export const BENEFICIAL_OWNER_VERIFICATION_STATUSES = ['pending', 'verified', 'failed', 'expired'] as const;

export const BENEFICIAL_OWNER_ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  director: 'Director',
  controller: 'Controller',
  signatory: 'Authorized Signatory',
};
