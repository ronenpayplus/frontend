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
  activated_at?: string;
  created_at: string;
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
  NEW: 'חדש',
  PENDING_KYC: 'ממתין ל-KYC',
  ACTIVE: 'פעיל',
  RESTRICTED: 'מוגבל',
  SUSPENDED: 'מושעה',
  CLOSED: 'סגור',
  TERMINATED: 'בוטל',
};

export const COMPANY_TYPE_LABELS: Record<string, string> = {
  holding_company: 'חברת אחזקות',
  operating_company: 'חברה תפעולית',
  single_entity: 'ישות בודדת',
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: 'עצמאי',
  company: 'חברה',
  non_profit: 'עמותה',
  government_entity: 'גוף ממשלתי',
};

export const RISK_PROFILE_LABELS: Record<string, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  critical: 'קריטי',
  custom: 'מותאם',
};

export const VOLUME_TIER_LABELS: Record<string, string> = {
  starter: 'התחלתי',
  growth: 'צמיחה',
  enterprise: 'ארגוני',
  custom: 'מותאם',
};

export const MOCK_CURRENCIES = [
  { code: 'ILS', name: 'שקל ישראלי' },
  { code: 'USD', name: 'דולר אמריקאי' },
  { code: 'EUR', name: 'אירו' },
  { code: 'GBP', name: 'לירה שטרלינג' },
];

export const MOCK_COUNTRIES = [
  { code: 'IL', name: 'ישראל' },
  { code: 'US', name: 'ארצות הברית' },
  { code: 'GB', name: 'בריטניה' },
  { code: 'DE', name: 'גרמניה' },
  { code: 'FR', name: 'צרפת' },
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
