# Backend API Changes — DDL v10 Alignment

New fields were added to 4 entities across all backend layers (HTTP/gRPC/DB). All fields are available in create, update, get, and list endpoints. All are optional (`omitempty`) unless stated otherwise.

---

## 1. Account — 1 new field

### Type file: `src/types/account.ts`

Add to `Account`, `CreateAccountRequest`, and `UpdateAccountRequest`:

```typescript
industry?: string;  // Free-text, max 100 chars (e.g., "fintech", "retail", "healthcare")
```

### JSON key: `"industry"`

### UI placement suggestion:
Place near `mcc` / `business_type` fields — it's a business classification field.

---

## 2. Beneficial Owner — 9 new fields (Corporate UBO support)

### Type file: `src/types/beneficialOwner.ts`

Add to `BeneficialOwner`, `CreateBeneficialOwnerRequest`, and `UpdateBeneficialOwnerRequest`:

```typescript
// Personal fields
email?: string;            // Email address of the beneficial owner
job_title?: string;        // Job title (e.g., "CEO", "CFO")

// Entity type selector — controls which fields are relevant
owner_entity_type?: string; // "individual" (default) | "corporate"

// Corporate UBO fields (only relevant when owner_entity_type === "corporate")
account_name?: string;                // Corporate entity name
account_type?: string;                // Corporate entity type
account_country?: string;             // ISO 2-letter country code (e.g., "US", "IL")
account_registration_number?: string; // Registration/incorporation number
account_tax_id?: string;              // Tax identification number
account_website?: string;             // Full URL
```

### JSON keys:
`"email"`, `"job_title"`, `"owner_entity_type"`, `"account_name"`, `"account_type"`, `"account_country"`, `"account_registration_number"`, `"account_tax_id"`, `"account_website"`

### New constants to add:

```typescript
export const OWNER_ENTITY_TYPES = ['individual', 'corporate'] as const;

export const OWNER_ENTITY_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  corporate: 'Corporate Entity',
};
```

### Validation rules from backend:
- `email`: valid email format
- `owner_entity_type`: must be `"individual"` or `"corporate"` (defaults to `"individual"` if empty)
- `account_country`: exactly 2 characters (ISO alpha-2)
- `account_website`: valid URL format

### UI implementation notes:
- Add an `owner_entity_type` toggle/select at the top of the form (default: "individual")
- When `owner_entity_type === "corporate"`, show a **"Corporate Details"** section with the 5 `account_*` fields
- When `owner_entity_type === "individual"`, hide the corporate fields
- `email` and `job_title` are shown for both entity types
- This supports EU AML5 directive requirements for corporate beneficial ownership

---

## 3. Merchant Account — 1 new field

### Type file: `src/types/merchantAccount.ts`

Add to `MerchantAccount`, `CreateMerchantAccountRequest`, and `UpdateMerchantAccountRequest`:

```typescript
short_descriptor?: string;  // Short payment descriptor, max 25 chars (appears on customer statements)
```

### JSON key: `"short_descriptor"`

### UI placement suggestion:
Place directly after the existing `descriptor` field. Add a character counter or maxlength=25 on the input.

---

## 4. Onboarding Application — 17 new KYB questionnaire fields

**Note:** This entity does NOT have a frontend type file yet (`src/types/onboardingApplication.ts` does not exist). If implementing the onboarding flow, create the full type. Below are just the new KYB fields.

### New fields for create, update, get, and list:

```typescript
// KYB Account Information
kyb_account_name?: string;           // Legal account name for KYB
kyb_account_type?: string;           // e.g., "LLC", "Corporation", "Partnership"
kyb_registration_number?: string;    // Account registration number
kyb_tax_id?: string;                 // Tax ID / VAT number
kyb_incorporation_date?: string;     // Date string "YYYY-MM-DD"
kyb_incorporation_country?: string;  // ISO 2-letter country code
kyb_business_description?: string;   // Free-text business description
kyb_industry?: string;               // Industry classification
kyb_website?: string;                // Account website URL

// KYB Financial Information
kyb_annual_revenue?: number;              // Annual revenue in minor units (cents)
kyb_employee_count?: number;              // Number of employees
kyb_expected_monthly_volume?: number;     // Expected monthly processing volume in minor units
kyb_expected_average_transaction?: number; // Expected average transaction amount in minor units

// KYB Additional Information
kyb_products_services?: string;                // Description of products/services
kyb_source_of_funds?: string;                  // Source of funds description
kyb_has_previous_processing_history?: boolean; // Default: false
kyb_previous_processor_name?: string;          // Only relevant if above is true
```

### JSON keys:
All prefixed with `kyb_` — see field names above.

### UI implementation notes:
- These 17 fields form a **KYB Questionnaire** section within the onboarding application form
- Group into logical sub-sections:
  1. **Account Information** (name, type, registration, tax_id, incorporation date/country, description, industry, website)
  2. **Financial Information** (annual revenue, employee count, expected volume, expected avg transaction)
  3. **Processing History** (products/services, source of funds, previous processing toggle + processor name)
- `kyb_has_previous_processing_history` is a boolean toggle — when `true`, show `kyb_previous_processor_name` input
- `kyb_incorporation_date` is a date picker (format: `YYYY-MM-DD`)
- `kyb_incorporation_country` is a country selector (2-letter ISO code)
- Revenue/volume fields are in minor currency units (cents) — consider displaying as formatted currency in the UI

---

## Summary Table

| Entity | Field | JSON Key | Type | Notes |
|--------|-------|----------|------|-------|
| Account | industry | `industry` | string | Max 100 chars |
| Beneficial Owner | email | `email` | string | Valid email |
| Beneficial Owner | job_title | `job_title` | string | Free text |
| Beneficial Owner | owner_entity_type | `owner_entity_type` | string | `"individual"` \| `"corporate"` |
| Beneficial Owner | account_name | `account_name` | string | Corporate UBO only |
| Beneficial Owner | account_type | `account_type` | string | Corporate UBO only |
| Beneficial Owner | account_country | `account_country` | string | 2-char ISO code |
| Beneficial Owner | account_registration_number | `account_registration_number` | string | Corporate UBO only |
| Beneficial Owner | account_tax_id | `account_tax_id` | string | Corporate UBO only |
| Beneficial Owner | account_website | `account_website` | string | Valid URL |
| Merchant Account | short_descriptor | `short_descriptor` | string | Max 25 chars |
| Onboarding App | kyb_account_name | `kyb_account_name` | string | KYB questionnaire |
| Onboarding App | kyb_account_type | `kyb_account_type` | string | KYB questionnaire |
| Onboarding App | kyb_registration_number | `kyb_registration_number` | string | KYB questionnaire |
| Onboarding App | kyb_tax_id | `kyb_tax_id` | string | KYB questionnaire |
| Onboarding App | kyb_incorporation_date | `kyb_incorporation_date` | string | `YYYY-MM-DD` format |
| Onboarding App | kyb_incorporation_country | `kyb_incorporation_country` | string | 2-char ISO code |
| Onboarding App | kyb_business_description | `kyb_business_description` | string | Free text |
| Onboarding App | kyb_industry | `kyb_industry` | string | Free text |
| Onboarding App | kyb_website | `kyb_website` | string | URL |
| Onboarding App | kyb_annual_revenue | `kyb_annual_revenue` | number | Minor units |
| Onboarding App | kyb_employee_count | `kyb_employee_count` | number | Integer |
| Onboarding App | kyb_expected_monthly_volume | `kyb_expected_monthly_volume` | number | Minor units |
| Onboarding App | kyb_expected_average_transaction | `kyb_expected_average_transaction` | number | Minor units |
| Onboarding App | kyb_products_services | `kyb_products_services` | string | Free text |
| Onboarding App | kyb_source_of_funds | `kyb_source_of_funds` | string | Free text |
| Onboarding App | kyb_has_previous_processing_history | `kyb_has_previous_processing_history` | boolean | Default false |
| Onboarding App | kyb_previous_processor_name | `kyb_previous_processor_name` | string | Conditional |

---

## Files to update:

1. **`src/types/account.ts`** — Add `industry` to `Account`, `CreateAccountRequest`, `UpdateAccountRequest`
2. **`src/types/beneficialOwner.ts`** — Add 9 fields + new constants for `OWNER_ENTITY_TYPES`
3. **`src/types/merchantAccount.ts`** — Add `short_descriptor` to all 3 interfaces
4. **`src/pages/AccountsPage.tsx`** (or equivalent) — Add `industry` field to create/edit forms and detail view
5. **`src/pages/BeneficialOwnersPage.tsx`** — Add entity type selector, email, job_title, conditional corporate section
6. **`src/pages/MerchantAccountsPage.tsx`** — Add `short_descriptor` input next to `descriptor`
7. **Create `src/types/onboardingApplication.ts`** if implementing onboarding (17 KYB fields)

No API endpoint URLs changed for existing entities. No breaking changes — all new fields are optional.

---

## 5. Station — NEW entity (child of Store)

### Endpoints:
- `POST /v2/accounts/stations/create-with-address-and-location` — Create station (with inline address)
- `GET /v2/accounts/stations/list?store_uuid=...&station_type=...&status=...&search=...&page=1&page_size=20` — List
- `GET /v2/accounts/stations/get/:uuid` — Get by UUID
- `PUT /v2/accounts/stations/update-with-address-and-location` — Update (body includes `uuid`)
- `DELETE /v2/accounts/stations/delete/:uuid` — Delete

### Type file: `src/types/station.ts` (NEW)
### API file: `src/api/stations.ts` (NEW)
### Page file: `src/pages/StationsPage.tsx` (NEW)

### Station types: `CHECKOUT`, `KIOSK`, `SERVICE_DESK`, `FUEL_PUMP`, `CHARGING`, `OTHER`
### Station statuses: `ACTIVE`, `SUSPENDED`, `CLOSED`, `MAINTENANCE`

---

## 6. Location — API behavior change

The `/locations/create`, `/locations/update/:uuid`, and `/locations/delete/:uuid` endpoints now use business flows that:
- Accept an inline `address` object (creates the address automatically)
- Accept an `address_id` referencing an existing address
- On delete, clean up orphaned addresses

No type changes needed — the frontend types already supported `address?: AddressInput`.
