import type { Pagination } from './company';

export interface Currency {
  id: number;
  alpha3: string;
  numeric_code: string;
  name: string;
  symbol?: string;
  decimals: number;
  minor_unit: number;
  country_alpha2?: string;
  is_active: boolean;
  is_crypto: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListCurrenciesParams {
  is_active?: string;
  is_crypto?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListCurrenciesResponse {
  currencies: Currency[];
  pagination: Pagination;
}

export interface CreateCurrencyRequest {
  alpha3: string;
  numeric_code: string;
  name: string;
  symbol?: string;
  decimals?: number;
  minor_unit?: number;
  country_alpha2?: string;
  is_active: boolean;
  is_crypto: boolean;
}

export interface UpdateCurrencyRequest extends CreateCurrencyRequest {}
