import type { Pagination } from './company';
import type { LocalizationInput } from './orgEntityLocalization';

export interface MerchantAccount {
  uuid: string;
  merchant_uuid: string;
  company_uuid: string;
  legal_entity_uuid: string;
  merchant_id_external?: string;
  name: string;
  merchant_code: string;
  mcc: string;
  contract_type?: string;
  volume_tier?: string;
  status: string;
  kyc_status?: string;
  aml_status?: string;
  risk_profile?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  country: string;
  currency: string;
  timezone: string;
  descriptor?: string;
  settlement_type?: string;
  payout_schedule?: string;
  phone?: string;
  email?: string;
  callback_url?: string;
  webhook_url?: string;
  integration_mode?: string;
  default_payment_flow?: string;
  default_acquiring_model: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListMerchantAccountsParams {
  merchant_uuid?: string;
  company_uuid?: string;
  legal_entity_uuid?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListMerchantAccountsResponse {
  merchant_accounts: MerchantAccount[];
  pagination: Pagination;
}

export interface CreateMerchantAccountRequest {
  merchant_uuid: string;
  company_uuid: string;
  legal_entity_uuid: string;
  name: string;
  merchant_code: string;
  mcc: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  country: string;
  currency: string;
  timezone: string;
  status?: string;
  kyc_status?: string;
  aml_status?: string;
  risk_profile?: string;
  contract_type?: string;
  volume_tier?: string;
  descriptor?: string;
  settlement_type?: string;
  payout_schedule?: string;
  phone?: string;
  email?: string;
  callback_url?: string;
  webhook_url?: string;
  integration_mode?: string;
  default_payment_flow?: string;
  default_acquiring_model?: string;
  notes?: string;
  localizations?: LocalizationInput[];
}

export interface UpdateMerchantAccountRequest {
  uuid?: string;
  name: string;
  merchant_code: string;
  mcc: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  country: string;
  currency: string;
  timezone: string;
  status: string;
  kyc_status: string;
  aml_status?: string;
  risk_profile?: string;
  contract_type?: string;
  volume_tier?: string;
  descriptor?: string;
  settlement_type?: string;
  payout_schedule?: string;
  phone?: string;
  email?: string;
  callback_url?: string;
  webhook_url?: string;
  integration_mode?: string;
  default_payment_flow?: string;
  default_acquiring_model?: string;
  notes?: string;
  localizations?: LocalizationInput[];
}
