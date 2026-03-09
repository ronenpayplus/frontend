export interface StoreLocationLink {
  store_uuid: string;
  location_uuid: string;
  role: string;
  priority: number;
  created_at: string;
}

export interface CreateStoreLocationLinkRequest {
  store_uuid: string;
  location_uuid: string;
  role: string;
  priority: number;
}

export interface DeleteStoreLocationLinkRequest {
  store_uuid: string;
  location_uuid: string;
  role: string;
}

export interface ListStoreLocationLinksResponse {
  store_location_links: StoreLocationLink[];
}

export const STORE_LOCATION_ROLES = ['SALES', 'FULFILLMENT', 'RETURNS', 'PICKUP'] as const;

export const STORE_LOCATION_ROLE_LABELS: Record<string, string> = {
  SALES: 'Sales',
  FULFILLMENT: 'Fulfillment',
  RETURNS: 'Returns',
  PICKUP: 'Pickup',
};
