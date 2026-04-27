import type { Pagination } from './account';

export interface Industry {
  id: number;
  code: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListIndustriesParams {
  category?: string;
  is_active?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListIndustriesResponse {
  industries: Industry[];
  pagination: Pagination;
}
