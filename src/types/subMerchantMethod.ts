export interface SubMerchantMethod {
  sub_merchant_uuid: string;
  method_code: string;
  is_enabled: boolean;
  created_at: string;
}

export interface ListSubMerchantMethodsResponse {
  sub_merchant_methods: SubMerchantMethod[];
}

export interface SetSubMerchantMethodsRequest {
  sub_merchant_uuid: string;
  methods: { method_code: string; is_enabled: boolean }[];
}

export interface SetSubMerchantMethodsResponse {
  success: boolean;
  updated_at: string;
  methods: SubMerchantMethod[];
}
