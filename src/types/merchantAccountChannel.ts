export interface MerchantAccountChannel {
  merchant_account_uuid: string;
  channel_type: string;
  created_at: string;
}

export interface ListMerchantAccountChannelsResponse {
  merchant_account_channels: MerchantAccountChannel[];
}

export interface SetMerchantAccountChannelsRequest {
  merchant_account_uuid: string;
  channels: { channel_type: string }[];
}

export interface SetMerchantAccountChannelsResponse {
  success: boolean;
  updated_at: string;
  channels: MerchantAccountChannel[];
}
