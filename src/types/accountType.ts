import type { Pagination } from './account';

export interface AccountType {
  id: number;
  slug: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListAccountTypesParams {
  category?: string;
  is_active?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListAccountTypesResponse {
  account_types: AccountType[];
  pagination: Pagination;
}
