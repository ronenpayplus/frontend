export interface SubMerchantChannel {
  sub_merchant_uuid: string;
  channel_type: string;
  created_at: string;
}

export interface ListSubMerchantChannelsResponse {
  sub_merchant_channels: SubMerchantChannel[];
}

export interface SetSubMerchantChannelsRequest {
  sub_merchant_uuid: string;
  channels: { channel_type: string }[];
}

export interface SetSubMerchantChannelsResponse {
  success: boolean;
  updated_at: string;
  channels: SubMerchantChannel[];
}
