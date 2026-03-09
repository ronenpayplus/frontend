import type { Pagination } from './company';
import type { AddressInput } from './address';

export interface Station {
  uuid: string;
  store_uuid: string;
  station_code: string;
  station_type: string;
  name: string;
  status: string;
  address_id?: number;
  location_id?: number;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListStationsParams {
  store_uuid?: string;
  station_type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListStationsResponse {
  stations: Station[];
  pagination: Pagination;
}

export interface CreateStationRequest {
  store_uuid: string;
  station_code: string;
  station_type: string;
  name: string;
  status?: string;
  address_id?: number;
  address?: AddressInput;
  location_id?: number;
  phone?: string;
}

export interface UpdateStationRequest {
  station_code: string;
  station_type: string;
  name: string;
  status: string;
  address_id?: number;
  address?: AddressInput;
  location_id?: number;
  phone?: string;
}

export const STATION_TYPES = ['CHECKOUT', 'KIOSK', 'SERVICE_DESK', 'FUEL_PUMP', 'CHARGING', 'OTHER'] as const;

export const STATION_TYPE_LABELS: Record<string, string> = {
  CHECKOUT: 'Checkout',
  KIOSK: 'Kiosk',
  SERVICE_DESK: 'Service Desk',
  FUEL_PUMP: 'Fuel Pump',
  CHARGING: 'Charging',
  OTHER: 'Other',
};

export const STATION_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED', 'MAINTENANCE'] as const;
