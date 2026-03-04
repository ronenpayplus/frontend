export interface MerchantAccountMethod {
  merchant_account_uuid: string;
  method_code: string;
  is_enabled: boolean;
  created_at: string;
}

export interface ListMerchantAccountMethodsResponse {
  merchant_account_methods: MerchantAccountMethod[];
}

export interface SetMerchantAccountMethodsRequest {
  merchant_account_uuid: string;
  methods: { method_code: string; is_enabled: boolean }[];
}

export interface SetMerchantAccountMethodsResponse {
  success: boolean;
  updated_at: string;
  methods: MerchantAccountMethod[];
}
