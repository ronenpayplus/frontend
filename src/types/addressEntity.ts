import type { Pagination } from './account';

export interface AddressEntity {
  uuid: string;
  address_type?: string;
  country_code: string;
  state?: string;
  city: string;
  district?: string;
  postal_code?: string;
  line1: string;
  line2?: string;
  line3?: string;
  account_name?: string;
  contact_name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  validated: boolean;
  validated_at?: string;
  validation_source?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListAddressesParams {
  search?: string;
  address_type?: string;
  country_code?: string;
  city?: string;
  validated?: string;
  page?: number;
  page_size?: number;
}

export interface ListAddressesResponse {
  addresses: AddressEntity[];
  pagination: Pagination;
}

export interface CreateAddressRequest {
  address_type?: string;
  country_code: string;
  state?: string;
  city: string;
  district?: string;
  postal_code?: string;
  line1: string;
  line2?: string;
  line3?: string;
  account_name?: string;
  contact_name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  validation_source?: string;
}

export interface UpdateAddressRequest extends CreateAddressRequest {
  validated: boolean;
}
