import type { Pagination } from './account';

export interface Country {
  id: number;
  alpha2: string;
  alpha3: string;
  numeric_code: string;
  name: string;
  official_name?: string;
  region?: string;
  sub_region?: string;
  phone_prefix?: string;
  default_lang_code?: string;
  is_active: boolean;
  is_sanctioned: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListCountriesParams {
  region?: string;
  is_active?: string;
  is_sanctioned?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListCountriesResponse {
  countries: Country[];
  pagination: Pagination;
}

export interface CreateCountryRequest {
  alpha2: string;
  alpha3: string;
  numeric_code: string;
  name: string;
  official_name?: string;
  region?: string;
  sub_region?: string;
  phone_prefix?: string;
  default_lang_code?: string;
  is_active: boolean;
  is_sanctioned: boolean;
}

export interface UpdateCountryRequest extends CreateCountryRequest {}
