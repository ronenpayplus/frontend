import type { Pagination } from './company';

export interface CompanyContact {
  uuid: string;
  company_uuid: string;
  contact_type: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  lang_code: string;
  is_default: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListCompanyContactsParams {
  company_uuid: string;
  search?: string;
  contact_type?: string;
  is_default?: string;
  is_primary?: string;
  page?: number;
  page_size?: number;
}

export interface ListCompanyContactsResponse {
  contacts: CompanyContact[];
  pagination: Pagination;
}

export interface CreateCompanyContactRequest {
  company_uuid: string;
  contact_type?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  lang_code?: string;
  is_default: boolean;
  is_primary: boolean;
}

export interface UpdateCompanyContactRequest {
  contact_type?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  lang_code?: string;
  is_default: boolean;
  is_primary: boolean;
}

export const COMPANY_CONTACT_TYPES = ['general', 'technical', 'billing', 'compliance', 'support', 'legal'] as const;

export const COMPANY_CONTACT_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  technical: 'Technical',
  billing: 'Billing',
  compliance: 'Compliance',
  support: 'Support',
  legal: 'Legal',
};
