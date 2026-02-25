import type { Pagination } from './company';

export interface TimezoneRef {
  id: number;
  tz_name: string;
  utc_offset: string;
  utc_offset_minutes: number;
  region: string;
  country_alpha2?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListTimezonesParams {
  region?: string;
  country_alpha2?: string;
  is_active?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListTimezonesResponse {
  timezones: TimezoneRef[];
  pagination: Pagination;
}

export interface CreateTimezoneRequest {
  tz_name: string;
  utc_offset: string;
  utc_offset_minutes: number;
  region: string;
  country_alpha2?: string;
  is_active: boolean;
}

export interface UpdateTimezoneRequest extends CreateTimezoneRequest {}
