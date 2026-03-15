import type { Pagination } from './account';

export interface AccountContact {
  uuid: string;
  account_uuid: string;
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

export interface ListAccountContactsParams {
  account_uuid: string;
  search?: string;
  contact_type?: string;
  is_default?: string;
  is_primary?: string;
  page?: number;
  page_size?: number;
}

export interface ListAccountContactsResponse {
  contacts: AccountContact[];
  pagination: Pagination;
}

export interface CreateAccountContactRequest {
  account_uuid: string;
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

export interface UpdateAccountContactRequest {
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

export const ACCOUNT_CONTACT_TYPES = ['general', 'technical', 'billing', 'compliance', 'support', 'legal'] as const;

export const ACCOUNT_CONTACT_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  technical: 'Technical',
  billing: 'Billing',
  compliance: 'Compliance',
  support: 'Support',
  legal: 'Legal',
};
