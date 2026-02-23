import type { Pagination } from './company';

export interface TerminalGroup {
  uuid: string;
  store_uuid: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ListTerminalGroupsParams {
  store_uuid?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListTerminalGroupsResponse {
  terminal_groups: TerminalGroup[];
  pagination: Pagination;
}

export interface CreateTerminalGroupRequest {
  store_uuid: string;
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateTerminalGroupRequest {
  name: string;
  description?: string;
  status: string;
}

export const TERMINAL_GROUP_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;
