export interface SubMerchantCurrency {
  sub_merchant_uuid: string;
  currency_code: string;
  created_at?: string;
}

export interface ListSubMerchantCurrenciesResponse {
  sub_merchant_currencies: SubMerchantCurrency[];
}

export interface CreateSubMerchantCurrencyRequest {
  sub_merchant_uuid: string;
  currency_code: string;
}

export interface DeleteSubMerchantCurrencyRequest {
  sub_merchant_uuid: string;
  currency_code: string;
}
