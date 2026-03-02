export interface MerchantAccountCurrency {
  merchant_account_uuid: string;
  currency_code: string;
  is_default: boolean;
  created_at: string;
}

export interface ListMerchantAccountCurrenciesResponse {
  merchant_account_currencies: MerchantAccountCurrency[];
}

export interface CreateMerchantAccountCurrencyRequest {
  merchant_account_uuid: string;
  currency_code: string;
  is_default?: boolean;
}

export interface DeleteMerchantAccountCurrencyRequest {
  merchant_account_uuid: string;
  currency_code: string;
}
