import type { Pagination } from './company';

export interface Merchant {
  uuid: string;
  legal_entity_uuid: string;
  merchant_id_external?: string;
  name: string;
  merchant_code: string;
  category_code: string;
  mcc_default?: string;
  business_model?: string;
  status: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address_id?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListMerchantsParams {
  legal_entity_uuid?: string;
  search?: string;
  status?: string;
  business_model?: string;
  category_code?: string;
  page?: number;
  page_size?: number;
}

export interface ListMerchantsResponse {
  merchants: Merchant[];
  pagination: Pagination;
}

export interface CreateMerchantRequest {
  legal_entity_uuid: string;
  merchant_id_external?: string;
  name: string;
  merchant_code: string;
  category_code: string;
  mcc_default?: string;
  business_model?: string;
  status?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address_id?: number;
  notes?: string;
  created_by?: string;
}

export interface UpdateMerchantRequest {
  uuid?: string;
  merchant_id_external?: string;
  name: string;
  merchant_code: string;
  category_code: string;
  mcc_default?: string;
  business_model?: string;
  status: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address_id?: number;
  notes?: string;
  updated_by?: string;
}

export const MERCHANT_BUSINESS_MODELS = [
  'retail',
  'ecommerce',
  'marketplace',
  'saas',
  'subscription',
  'professional_services',
] as const;

export const MERCHANT_STATUSES = [
  'NEW',
  'PENDING_KYC',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'CLOSED',
  'TERMINATED',
] as const;

export const MERCHANT_BUSINESS_MODEL_LABELS: Record<string, string> = {
  retail: 'קמעונאות',
  ecommerce: 'איקומרס',
  marketplace: 'מרקטפלייס',
  saas: 'SaaS',
  subscription: 'מנויים',
  professional_services: 'שירותים מקצועיים',
};
