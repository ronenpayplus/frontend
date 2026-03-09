export interface AddressInput {
  address_type?: 'registered' | 'operating' | 'shipping' | 'billing' | 'other';
  country_code: string;
  state?: string;
  city: string;
  district?: string;
  postal_code?: string;
  line1: string;
  line2?: string;
  line3?: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
}
