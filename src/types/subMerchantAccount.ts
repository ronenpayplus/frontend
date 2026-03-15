import type { Pagination } from './account';
import type { LocalizationInput } from './orgEntityLocalization';

export interface SubMerchantAccount {
  uuid: string;
  merchant_account_uuid: string;
  merchant_uuid: string;
  name: string;
  sub_merchant_code?: string;
  entity_type?: string;
  seller_model: string;
  category_code: string;
  mcc_default?: string;
  status: string;
  onboarding_status?: string;
  kyc_status?: string;
  country: string;
  currency: string;
  timezone: string;
  payments_enabled: boolean;
  payouts_enabled: boolean;
  default_acquiring_model?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListSubMerchantAccountsParams {
  merchant_account_uuid?: string;
  merchant_uuid?: string;
  status?: string;
  onboarding_status?: string;
  kyc_status?: string;
  country?: string;
  currency?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListSubMerchantAccountsResponse {
  sub_merchant_accounts: SubMerchantAccount[];
  pagination: Pagination;
}

export interface CreateSubMerchantAccountRequest {
  merchant_account_uuid: string;
  merchant_uuid: string;
  name: string;
  sub_merchant_code?: string;
  entity_type?: string;
  seller_model: string;
  category_code: string;
  mcc_default?: string;
  status?: string;
  onboarding_status?: string;
  kyc_status?: string;
  country: string;
  currency: string;
  timezone: string;
  payments_enabled: boolean;
  payouts_enabled: boolean;
  default_acquiring_model?: string;
  notes?: string;
  localizations?: LocalizationInput[];
}

export interface UpdateSubMerchantAccountRequest {
  name: string;
  sub_merchant_code?: string;
  entity_type?: string;
  seller_model: string;
  category_code: string;
  mcc_default?: string;
  status: string;
  onboarding_status: string;
  kyc_status: string;
  country: string;
  currency: string;
  timezone: string;
  payments_enabled: boolean;
  payouts_enabled: boolean;
  default_acquiring_model?: string;
  notes?: string;
  localizations?: LocalizationInput[];
}

export const SUB_MERCHANT_ENTITY_TYPES = ['individual', 'sole_proprietor', 'account', 'non_profit'] as const;
export const SUB_MERCHANT_SELLER_MODELS = ['PLATFORM_MOR', 'SELLER_MOR'] as const;
export const SUB_MERCHANT_STATUSES = ['NEW', 'PENDING_KYC', 'ACTIVE', 'RESTRICTED', 'UNDER_REVIEW', 'SUSPENDED', 'BLOCKED', 'CLOSED', 'TERMINATED'] as const;
export const SUB_MERCHANT_ONBOARDING_STATUSES = ['NEW', 'DOCUMENTS_REQUIRED', 'PENDING_VERIFICATION', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE'] as const;
export const SUB_MERCHANT_KYC_STATUSES = ['not_started', 'documents_required', 'pending_verification', 'in_review', 'verified', 'failed', 'expired'] as const;
