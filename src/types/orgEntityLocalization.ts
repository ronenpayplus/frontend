export type OrgEntityOwnerType =
  | 'account'
  | 'legal_entity'
  | 'merchant'
  | 'merchant_account'
  | 'sub_merchant'
  | 'store'
  | 'terminal_group'
  | 'terminal';

export interface LocalizationInput {
  lang_code: string;
  display_name: string;
  brand_name?: string;
  legal_entity_name?: string;
  settlement_descriptor?: string;
  description?: string;
  website_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  support_email?: string;
  support_phone?: string;
  receipt_header?: string;
  receipt_footer?: string;
  invoice_notes?: string;
  is_default: boolean;
}

export interface OrgEntityLocalization extends LocalizationInput {
  uuid: string;
  owner_type: OrgEntityOwnerType;
  owner_uuid: string;
  created_at?: string;
  updated_at?: string;
}
