import type { Pagination } from './company';

export interface Terminal {
  uuid: string;
  terminal_group_uuid: string;
  terminal_code: string;
  terminal_type: string;
  status: string;
  device_model?: string;
  serial_number?: string;
  firmware_version?: string;
  hardware_id?: string;
  mac_address?: string;
  ip_address?: string;
  endpoint_url?: string;
  integration_type?: string;
  sdk_version?: string;
  platform?: string;
  callback_url?: string;
  assigned_user?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListTerminalsParams {
  terminal_group_uuid?: string;
  terminal_type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListTerminalsResponse {
  terminals: Terminal[];
  pagination: Pagination;
}

export interface CreateTerminalRequest {
  terminal_group_uuid: string;
  terminal_code: string;
  terminal_type?: string;
  status?: string;
  device_model?: string;
  serial_number?: string;
  firmware_version?: string;
  hardware_id?: string;
  mac_address?: string;
  ip_address?: string;
  endpoint_url?: string;
  integration_type?: string;
  sdk_version?: string;
  platform?: string;
  callback_url?: string;
  assigned_user?: string;
}

export interface UpdateTerminalRequest {
  terminal_code: string;
  terminal_type: string;
  status: string;
  device_model?: string;
  serial_number?: string;
  firmware_version?: string;
  hardware_id?: string;
  mac_address?: string;
  ip_address?: string;
  endpoint_url?: string;
  integration_type?: string;
  sdk_version?: string;
  platform?: string;
  callback_url?: string;
  assigned_user?: string;
}

export const TERMINAL_TYPES = ['physical', 'virtual', 'softpos'] as const;
export const TERMINAL_STATUSES = ['ACTIVE', 'PROVISIONING', 'SUSPENDED', 'CLOSED', 'MAINTENANCE'] as const;
export const TERMINAL_INTEGRATION_TYPES = ['SDK', 'API', 'REDIRECT', 'PLUGIN', 'HOSTED'] as const;
export const TERMINAL_PLATFORMS = ['ANDROID', 'IOS', 'LINUX', 'WINDOWS', 'PROPRIETARY'] as const;
