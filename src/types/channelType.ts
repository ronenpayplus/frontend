import type { Pagination } from './account';

export interface ChannelType {
  channel_code: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface ListChannelTypesParams {
  is_active?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListChannelTypesResponse {
  channel_types: ChannelType[];
  pagination: Pagination;
}

export interface CreateChannelTypeRequest {
  channel_code: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface UpdateChannelTypeRequest extends CreateChannelTypeRequest {}
