import type { Pagination } from './company';
import type { LocalizationInput } from './orgEntityLocalization';

export interface LegalEntity {
  uuid: string;
  company_uuid: string;
  legal_name: string;
  entity_type: string;
  tax_id: string;
  tax_id_type: string;
  vat_number?: string;
  registration_number?: string;
  date_of_incorporation?: string;
  country: string;
  registered_address_id: number;
  operating_address_id?: number;
  kyc_status: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ListLegalEntitiesParams {
  company_uuid: string;
  search?: string;
  status?: string;
  entity_type?: string;
  kyc_status?: string;
  country?: string;
  page?: number;
  page_size?: number;
}

export interface ListLegalEntitiesResponse {
  legal_entities: LegalEntity[];
  pagination: Pagination;
}

export interface CreateLegalEntityRequest {
  company_uuid: string;
  legal_name: string;
  entity_type: string;
  tax_id: string;
  tax_id_type: string;
  vat_number?: string;
  registration_number?: string;
  date_of_incorporation?: string;
  country: string;
  registered_address_id: number;
  operating_address_id?: number;
  created_by?: string;
  localizations?: LocalizationInput[];
}

export interface UpdateLegalEntityRequest {
  legal_name: string;
  entity_type: string;
  tax_id: string;
  tax_id_type: string;
  vat_number?: string;
  registration_number?: string;
  date_of_incorporation?: string;
  country: string;
  registered_address_id: number;
  operating_address_id?: number;
  kyc_status: string;
  status: string;
  updated_by?: string;
  localizations?: LocalizationInput[];
}

export const LEGAL_ENTITY_TYPES = [
  'corporation',
  'llc',
  'limited',
  'sole_proprietor',
  'partnership',
  'non_profit',
  'government',
] as const;

export const TAX_ID_TYPES = [
  'ein',
  'vat',
  'gst',
  'abn',
  'business_number',
  'national_id',
  'other',
] as const;

export const LEGAL_ENTITY_KYC_STATUSES = [
  'pending',
  'in_review',
  'verified',
  'rejected',
  'expired',
] as const;

export const LEGAL_ENTITY_STATUSES = [
  'active',
  'pending_verification',
  'verified',
  'suspended',
  'dissolved',
] as const;

export const LEGAL_ENTITY_TYPE_LABELS: Record<string, string> = {
  corporation: 'Corporation',
  llc: 'LLC',
  limited: 'Limited Company',
  sole_proprietor: 'Sole Proprietor',
  partnership: 'Partnership',
  non_profit: 'Non-profit',
  government: 'Government',
};

export const LEGAL_ENTITY_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  suspended: 'Suspended',
  dissolved: 'Dissolved',
};

export const LEGAL_ENTITY_KYC_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
};
