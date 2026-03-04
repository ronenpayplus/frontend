import type { Pagination } from './company';

export type PaymentMethodCategory =
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'WALLET'
  | 'BNPL'
  | 'CRYPTO'
  | 'VOUCHER'
  | 'OTHER';

export interface PaymentMethod {
  method_code: string;
  display_name: string;
  category: PaymentMethodCategory;
  brand?: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
}

export interface ListPaymentMethodsParams {
  category?: string;
  is_active?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListPaymentMethodsResponse {
  payment_methods: PaymentMethod[];
  pagination: Pagination;
}

export interface CreatePaymentMethodRequest {
  method_code: string;
  display_name: string;
  category: PaymentMethodCategory;
  brand?: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpdatePaymentMethodRequest extends CreatePaymentMethodRequest {}
