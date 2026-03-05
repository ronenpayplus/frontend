export interface Company {
  uuid: string;
  name: string;
  number: string;
  status: string;
  company_type: string;
  business_type?: string;
  platform_account_type?: string;
  contract_type?: string;
  default_currency: string;
  default_country: string;
  timezone: string;
  mcc?: string;
  high_risk_merchant: boolean;
  is_blocked: boolean;
  risk_profile?: string;
  kyc_status?: string;
  aml_status?: string;
  website?: string;
  support_email?: string;
  support_phone?: string;
  volume_tier?: string;
  monthly_volume_limit?: number;
  message_for_client?: string;
  localizations?: CompanyLocalization[];
  activated_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CompanyLocalizationInput {
  lang_code: string;
  display_name: string;
  brand_name?: string;
  legal_entity_name?: string;
  settlement_descriptor?: string;
  description?: string;
  website_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  support_email?: string;
  support_phone?: string;
  receipt_header?: string;
  receipt_footer?: string;
  invoice_notes?: string;
  is_default: boolean;
}

export interface CompanyLocalization extends CompanyLocalizationInput {
  uuid: string;
  owner_type: string;
  owner_uuid: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyRequest {
  name: string;
  number: string;
  company_type: string;
  business_type?: string;
  platform_account_type?: string;
  contract_type?: string;
  default_currency: string;
  default_country: string;
  timezone: string;
  mcc?: string;
  high_risk_merchant: boolean;
  risk_profile?: string;
  website?: string;
  support_email?: string;
  support_phone?: string;
  volume_tier?: string;
  monthly_volume_limit?: number;
  message_for_client?: string;
  localizations?: CompanyLocalizationInput[];
  parent_company_uuid?: string;
  created_by?: string;
}

export interface UpdateCompanyRequest {
  name: string;
  number: string;
  status: string;
  company_type: string;
  business_type?: string;
  platform_account_type?: string;
  contract_type?: string;
  default_currency: string;
  default_country: string;
  timezone: string;
  mcc?: string;
  high_risk_merchant: boolean;
  is_blocked: boolean;
  risk_profile?: string;
  kyc_status?: string;
  aml_status?: string;
  website?: string;
  support_email?: string;
  support_phone?: string;
  volume_tier?: string;
  monthly_volume_limit?: number;
  message_for_client?: string;
  localizations?: CompanyLocalizationInput[];
  updated_by?: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface ListCompaniesResponse {
  companies: Company[];
  pagination: Pagination;
}

export interface ListCompaniesParams {
  search?: string;
  status?: string;
  company_type?: string;
  country?: string;
  created_at_from?: string;
  created_at_to?: string;
  page?: number;
  page_size?: number;
}

export const COMPANY_STATUSES = [
  'NEW', 'PENDING_KYC', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'CLOSED', 'TERMINATED',
] as const;

export const COMPANY_TYPES = [
  'holding_company', 'operating_company', 'single_entity',
] as const;

export const BUSINESS_TYPES = [
  'individual', 'company', 'non_profit', 'government_entity',
] as const;

export const PLATFORM_ACCOUNT_TYPES = [
  'standard', 'express', 'custom',
] as const;

export const CONTRACT_TYPES = [
  'direct', 'aggregator', 'marketplace', 'payfac', 'mixed',
] as const;

export const RISK_PROFILES = [
  'low', 'medium', 'high', 'critical', 'custom',
] as const;

export const KYC_STATUSES = [
  'not_started', 'pending', 'in_review', 'verified', 'failed', 'expired',
] as const;

export const AML_STATUSES = [
  'pending', 'clear', 'review', 'blocked',
] as const;

export const VOLUME_TIERS = [
  'starter', 'growth', 'enterprise', 'custom',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  PENDING_KYC: 'Pending KYC',
  ACTIVE: 'Active',
  RESTRICTED: 'Restricted',
  SUSPENDED: 'Suspended',
  CLOSED: 'Closed',
  TERMINATED: 'Terminated',
};

export const COMPANY_TYPE_LABELS: Record<string, string> = {
  holding_company: 'Holding Company',
  operating_company: 'Operating Company',
  single_entity: 'Single Entity',
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  company: 'Company',
  non_profit: 'Non-profit',
  government_entity: 'Government Entity',
};

export const RISK_PROFILE_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
  custom: 'Custom',
};

export const VOLUME_TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
  custom: 'Custom',
};

export const MOCK_CURRENCIES = [
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Pound Sterling' },
];

export const MOCK_COUNTRIES = [
  { code: 'IL', name: 'Israel' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

export const MOCK_TIMEZONES = [
  'Asia/Jerusalem',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'UTC',
];
