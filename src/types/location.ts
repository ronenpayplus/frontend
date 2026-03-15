import type { Pagination } from './account';
import type { AddressInput } from './address';

export interface Location {
  uuid: string;
  account_uuid: string;
  location_type: string;
  name: string;
  address_id: number;
  status: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListLocationsParams {
  account_uuid?: string;
  location_type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListLocationsResponse {
  locations: Location[];
  pagination: Pagination;
}

export interface CreateLocationRequest {
  account_uuid: string;
  location_type: string;
  name: string;
  address_id?: number;
  address?: AddressInput;
  status?: string;
  phone?: string;
}

export interface UpdateLocationRequest {
  location_type: string;
  name: string;
  address_id?: number;
  address?: AddressInput;
  status: string;
  phone?: string;
}

export const LOCATION_TYPES = ['BRANCH', 'WAREHOUSE', 'HQ', 'PICKUP_POINT', 'OFFICE'] as const;

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  BRANCH: 'Branch',
  WAREHOUSE: 'Warehouse',
  HQ: 'Headquarters',
  PICKUP_POINT: 'Pickup Point',
  OFFICE: 'Office',
};

export const LOCATION_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;
