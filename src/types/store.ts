import type { Pagination } from './company';
import type { LocalizationInput } from './orgEntityLocalization';

export interface Store {
  uuid: string;
  merchant_account_uuid: string;
  store_code: string;
  store_type: string;
  name: string;
  timezone: string;
  channel_type: string;
  status: string;
  address_id?: number;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListStoresParams {
  merchant_account_uuid?: string;
  store_type?: string;
  channel_type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListStoresResponse {
  stores: Store[];
  pagination: Pagination;
}

export interface CreateStoreRequest {
  merchant_account_uuid: string;
  store_code: string;
  store_type: string;
  name: string;
  timezone: string;
  channel_type: string;
  status?: string;
  address_id?: number;
  phone?: string;
  email?: string;
  localizations?: LocalizationInput[];
}

export interface UpdateStoreRequest {
  store_code: string;
  store_type: string;
  name: string;
  timezone: string;
  channel_type: string;
  status: string;
  address_id?: number;
  phone?: string;
  email?: string;
  localizations?: LocalizationInput[];
}

export const STORE_TYPES = ['physical', 'online', 'mobile', 'popup'] as const;
export const STORE_CHANNEL_TYPES = ['POS', 'ECOMMERCE', 'API', 'MOBILE'] as const;
export const STORE_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;
